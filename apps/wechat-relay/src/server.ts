import { createServer, type IncomingHttpHeaders, type IncomingMessage } from "node:http"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { readRelayConfig, type RelayConfig } from "./config.js"
import { handleRelayRequest, type RelayHandlerDependencies } from "./handler.js"
import { NonceStore } from "./nonceStore.js"

const requestLimit = 12_000_000
const timeoutMs = 15_000
// Receiving an image through the tunnel precedes the upstream request deadline.
const receiveTimeoutMs = 60_000

class NodeRequestRejection extends Error {
	constructor(readonly status: number) {
		super("Relay request rejected.")
	}
}

function genericError(status: number): Response {
	return Response.json({ error: "relay_request_rejected" }, { status })
}

function toWebHeaders(source: IncomingHttpHeaders): Headers {
	const headers = new Headers()
	for (const [name, value] of Object.entries(source)) {
		if (Array.isArray(value)) {
			for (const item of value) headers.append(name, item)
		} else if (value !== undefined) {
			headers.set(name, value)
		}
	}
	return headers
}

async function readIncomingBody(request: IncomingMessage): Promise<Uint8Array> {
	const contentLength = request.headers["content-length"]
	if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > requestLimit))
		throw new NodeRequestRejection(413)
	const chunks: Uint8Array[] = []
	let size = 0
	for await (const value of request) {
		const chunk = typeof value === "string" ? Buffer.from(value) : new Uint8Array(value)
		size += chunk.byteLength
		if (size > requestLimit) throw new NodeRequestRejection(413)
		chunks.push(chunk)
	}
	const body = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		body.set(chunk, offset)
		offset += chunk.byteLength
	}
	return body
}

async function toWebRequest(request: IncomingMessage): Promise<Request> {
	const target = request.url ?? "/"
	if (!target.startsWith("/") || target.startsWith("//")) throw new NodeRequestRejection(400)
	const body = await readIncomingBody(request)
	return new Request(new URL(target, "http://relay.local"), {
		method: request.method ?? "GET",
		headers: toWebHeaders(request.headers),
		body: body.byteLength > 0 ? body : undefined,
	})
}

export function createRelayServer(
	config: RelayConfig,
	overrides: Partial<Omit<RelayHandlerDependencies, "sharedSecret">> = {}
) {
	const dependencies: RelayHandlerDependencies = {
		sharedSecret: config.sharedSecret,
		fetch,
		now: Date.now,
		nonceStore: new NonceStore(),
		timeoutMs,
		...overrides,
	}
	const server = createServer(
		{
			headersTimeout: 5_000,
			keepAliveTimeout: 5_000,
			maxHeaderSize: 16_384,
			requestTimeout: receiveTimeoutMs,
		},
		async (incoming, outgoing) => {
			let response: Response
			try {
				response = await handleRelayRequest(await toWebRequest(incoming), dependencies)
			} catch (error) {
				response = genericError(error instanceof NodeRequestRejection ? error.status : 502)
			}
			outgoing.statusCode = response.status
			const contentType = response.headers.get("content-type")
			if (contentType) outgoing.setHeader("content-type", contentType)
			outgoing.end(Buffer.from(await response.arrayBuffer()))
		}
	)
	server.maxHeadersCount = 64
	return server
}

export function startRelayServer(config = readRelayConfig()) {
	const server = createRelayServer(config)
	server.listen(config.port, config.host, () => console.info("WeChat relay listening."))
	let stopping = false
	const stop = () => {
		if (stopping) return
		stopping = true
		server.close(() => {
			console.info("WeChat relay stopped.")
		})
	}
	process.once("SIGINT", stop)
	process.once("SIGTERM", stop)
	return server
}

const entrypoint = process.argv[1]
if (entrypoint && fileURLToPath(import.meta.url) === resolve(entrypoint)) startRelayServer()
