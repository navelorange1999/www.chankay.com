import {
	readRelayHeaders,
	verifyRelayRequest,
	type RelayMetadata,
} from "@chankay/wechat-relay-protocol"

import { NonceStore } from "./nonceStore.js"

export type RelayHandlerDependencies = {
	sharedSecret: string
	fetch: typeof fetch
	now: () => number
	nonceStore: NonceStore
	timeoutMs: number
}

const upstreamOrigin = "https://api.weixin.qq.com"
const requestLimit = 12_000_000
const responseLimit = 2_000_000
const clockSkewSeconds = 60
const allowedQueries: Record<string, ReadonlySet<string>> = {
	"/cgi-bin/stable_token": new Set(),
	"/cgi-bin/media/uploadimg": new Set(["access_token"]),
	"/cgi-bin/material/add_material": new Set(["access_token", "type"]),
	"/cgi-bin/draft/add": new Set(["access_token"]),
	"/cgi-bin/draft/get": new Set(["access_token"]),
}

class RelayRejection extends Error {
	constructor(readonly status: number) {
		super("Relay request rejected.")
	}
}

function rejected(status: number): Response {
	return Response.json({ error: "relay_request_rejected" }, { status })
}

async function readBounded(
	stream: ReadableStream<Uint8Array> | null,
	limit: number
): Promise<Uint8Array> {
	if (!stream) return new Uint8Array()
	const reader = stream.getReader()
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const chunk = await reader.read()
			if (chunk.done) break
			size += chunk.value.byteLength
			if (size > limit) {
				await reader.cancel()
				throw new RelayRejection(413)
			}
			chunks.push(chunk.value)
		}
	} finally {
		reader.releaseLock()
	}
	const result = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		result.set(chunk, offset)
		offset += chunk.byteLength
	}
	return result
}

function validateTarget(metadata: RelayMetadata): URL {
	const allowed = allowedQueries[metadata.target.split("?", 1)[0] ?? ""]
	let url: URL
	try {
		url = new URL(metadata.target, upstreamOrigin)
	} catch {
		throw new RelayRejection(403)
	}
	if (
		url.origin !== upstreamOrigin ||
		url.hash ||
		metadata.target !== `${url.pathname}${url.search}` ||
		!allowed ||
		url.pathname !== metadata.target.split("?", 1)[0]
	)
		throw new RelayRejection(403)
	const seen = new Set<string>()
	for (const [key] of url.searchParams) {
		if (!allowed.has(key) || seen.has(key)) throw new RelayRejection(403)
		seen.add(key)
	}
	if (url.pathname === "/cgi-bin/stable_token") {
		if (seen.size !== 0) throw new RelayRejection(403)
		return url
	}
	const token = url.searchParams.get("access_token")
	if (!token || token.length > 4096) throw new RelayRejection(403)
	if (url.pathname === "/cgi-bin/material/add_material" && url.searchParams.get("type") !== "image")
		throw new RelayRejection(403)
	return url
}

function validateFreshness(metadata: RelayMetadata, now: number): number {
	const timestamp = Number(metadata.timestamp) * 1000
	if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > clockSkewSeconds * 1000)
		throw new RelayRejection(401)
	return timestamp + clockSkewSeconds * 1000
}

export async function handleRelayRequest(
	request: Request,
	dependencies: RelayHandlerDependencies
): Promise<Response> {
	const localURL = new URL(request.url)
	if (request.method === "GET" && localURL.pathname === "/healthz")
		return Response.json({ status: "ok" })
	if (localURL.pathname !== "/v1/wechat") return rejected(404)
	if (request.method !== "POST") return rejected(405)
	try {
		const contentLength = request.headers.get("content-length")
		if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > requestLimit))
			throw new RelayRejection(413)
		const body = await readBounded(request.body, requestLimit)
		let parsed: ReturnType<typeof readRelayHeaders>
		try {
			parsed = readRelayHeaders(request.headers)
		} catch {
			throw new RelayRejection(401)
		}
		if (
			!(await verifyRelayRequest({
				headers: request.headers,
				body,
				secret: dependencies.sharedSecret,
			})) ||
			request.headers.get("content-type") !== parsed.metadata.contentType
		)
			throw new RelayRejection(401)
		const nonceExpiry = validateFreshness(parsed.metadata, dependencies.now())
		if (!dependencies.nonceStore.consume(parsed.metadata.nonce, nonceExpiry, dependencies.now()))
			throw new RelayRejection(409)
		const upstreamURL = validateTarget(parsed.metadata)
		const response = await dependencies.fetch(upstreamURL, {
			method: "POST",
			redirect: "error",
			signal: AbortSignal.timeout(dependencies.timeoutMs),
			headers: parsed.metadata.contentType
				? { "content-type": parsed.metadata.contentType }
				: undefined,
			body,
		})
		if (response.status >= 300 && response.status < 400) throw new RelayRejection(502)
		let responseBody: Uint8Array
		try {
			responseBody = await readBounded(response.body, responseLimit)
		} catch {
			throw new RelayRejection(502)
		}
		const contentType = response.headers.get("content-type")
		return new Response(responseBody, {
			status: response.status,
			headers: contentType ? { "content-type": contentType } : undefined,
		})
	} catch (error) {
		return rejected(error instanceof RelayRejection ? error.status : 502)
	}
}
