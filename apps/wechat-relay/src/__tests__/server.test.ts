import { request as sendRequest } from "node:http"

import { afterEach, describe, expect, it } from "vitest"

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
	it("bounds incoming headers and request duration", () => {
		const server = createRelayServer({
			host: "127.0.0.1",
			port: 8787,
			sharedSecret: "s".repeat(32),
		})
		expect(server.maxHeadersCount).toBe(64)
		expect(server.headersTimeout).toBe(5_000)
		expect(server.requestTimeout).toBe(15_000)
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
