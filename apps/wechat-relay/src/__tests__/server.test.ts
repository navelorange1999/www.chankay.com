import { request as sendRequest } from "node:http"

import { afterEach, describe, expect, it, vi } from "vitest"
import { signRelayRequest } from "@chankay/wechat-relay-protocol"

import { createRelayServer } from "../server.js"

const servers: ReturnType<typeof createRelayServer>[] = []

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise<void>((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve()))
				})
		)
	)
})

async function listen(server: ReturnType<typeof createRelayServer>): Promise<number> {
	servers.push(server)
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
	const address = server.address()
	if (!address || typeof address === "string") throw new Error("Test server did not listen.")
	return address.port
}

async function get(port: number, path: string): Promise<{ body: string; status: number }> {
	return new Promise((resolve, reject) => {
		const request = sendRequest({ host: "127.0.0.1", port, path, method: "GET" }, (response) => {
			const chunks: Buffer[] = []
			response.on("data", (chunk: Buffer) => chunks.push(chunk))
			response.on("end", () =>
				resolve({
					body: Buffer.concat(chunks).toString("utf8"),
					status: response.statusCode ?? 0,
				})
			)
		})
		request.on("error", reject)
		request.end()
	})
}

describe("relay server", () => {
	it("forwards a signed 1 MB FormData upload unchanged through the HTTP server", async () => {
		const sharedSecret = "s".repeat(32)
		const upstream = vi.fn(async () => Response.json({ media_id: "synthetic-media" }))
		const port = await listen(
			createRelayServer({ host: "127.0.0.1", port: 0, sharedSecret }, { fetch: upstream })
		)
		const form = new FormData()
		form.append("media", new Blob([new Uint8Array(1_000_000)], { type: "image/png" }), "image.png")
		const target = "/cgi-bin/material/add_material?access_token=synthetic&type=image"
		const request = new Request(`https://api.weixin.qq.com${target}`, {
			method: "POST",
			body: form,
		})
		const body = new Uint8Array(await request.arrayBuffer())
		const contentType = request.headers.get("content-type")!
		const headers = await signRelayRequest({
			metadata: {
				version: "1",
				timestamp: String(Math.floor(Date.now() / 1000)),
				nonce: crypto.randomUUID(),
				method: "POST",
				target,
				contentType,
			},
			body,
			secret: sharedSecret,
		})
		headers.set("content-type", contentType)
		const response = await fetch(`http://127.0.0.1:${port}/v1/wechat`, {
			method: "POST",
			headers,
			body,
		})
		expect(await response.json()).toEqual({ media_id: "synthetic-media" })
		expect(upstream).toHaveBeenCalledWith(
			new URL(`https://api.weixin.qq.com${target}`),
			expect.objectContaining({ body, headers: { "content-type": contentType } })
		)
	})

	it("bounds incoming headers and request duration", () => {
		const server = createRelayServer({
			host: "127.0.0.1",
			port: 8787,
			sharedSecret: "s".repeat(32),
		})
		expect(server.maxHeadersCount).toBe(64)
		expect(server.headersTimeout).toBe(5_000)
		expect(server.requestTimeout).toBe(60_000)
	})

	it("serves the health endpoint through the Node adapter", async () => {
		const server = createRelayServer({
			host: "127.0.0.1",
			port: 8787,
			sharedSecret: "s".repeat(32),
		})
		const port = await listen(server)

		const response = await get(port, "/healthz")

		expect(response.status).toBe(200)
		expect(JSON.parse(response.body)).toEqual({ status: "ok" })
	})

	it("returns the generic error shape for malformed request URLs", async () => {
		const server = createRelayServer({
			host: "127.0.0.1",
			port: 8787,
			sharedSecret: "s".repeat(32),
		})
		const port = await listen(server)

		const response = await get(port, "/unknown")

		expect(response.status).toBe(404)
		expect(JSON.parse(response.body)).toEqual({ error: "relay_request_rejected" })
	})
})
