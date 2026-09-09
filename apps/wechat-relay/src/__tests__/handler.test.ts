import { signRelayRequest, type RelayMetadata } from "@chankay/wechat-relay-protocol"
import { describe, expect, it, vi } from "vitest"

import { handleRelayRequest, type RelayHandlerDependencies } from "../handler.js"
import { NonceStore } from "../nonceStore.js"

const secret = "s".repeat(32)
const now = 1_788_912_000_000
const genericError = { error: "relay_request_rejected" }

function dependencies(
	upstreamFetch: typeof fetch = vi.fn().mockResolvedValue(Response.json({ ok: true })),
	overrides: Partial<RelayHandlerDependencies> = {}
): RelayHandlerDependencies {
	return {
		sharedSecret: secret,
		fetch: upstreamFetch,
		now: () => now,
		nonceStore: new NonceStore(),
		timeoutMs: 100,
		...overrides,
	}
}

async function signedRequest(
	target: string,
	body: Uint8Array = new TextEncoder().encode("{}"),
	options: {
		contentType?: string
		nonce?: string
		timestamp?: string
	} = {}
): Promise<Request> {
	const contentType = options.contentType ?? "application/json"
	const metadata: RelayMetadata = {
		version: "1",
		timestamp: options.timestamp ?? String(Math.floor(now / 1000)),
		nonce: options.nonce ?? crypto.randomUUID(),
		method: "POST",
		target,
		contentType,
	}
	const headers = await signRelayRequest({ metadata, body, secret })
	headers.set("content-type", contentType)
	return new Request("http://relay.local/v1/wechat", { method: "POST", headers, body })
}

async function expectGenericError(response: Response) {
	const text = await response.text()
	expect(JSON.parse(text)).toEqual(genericError)
	expect(text).not.toContain("access_token")
	expect(text).not.toContain(secret)
}

describe("relay handler", () => {
	it("reports health without configuration details", async () => {
		const response = await handleRelayRequest(
			new Request("http://relay.local/healthz"),
			dependencies()
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ status: "ok" })
	})

	it("forwards exact multipart bytes and content type", async () => {
		const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
		const upstream = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(String(input)).toBe(
				"https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=test-token"
			)
			expect(new Uint8Array(await new Response(init?.body).arrayBuffer())).toEqual(bytes)
			expect(new Headers(init?.headers).get("content-type")).toBe(
				"multipart/form-data; boundary=safe-boundary"
			)
			expect(init?.redirect).toBe("error")
			return Response.json({ url: "https://mmbiz.qpic.cn/image.jpg" })
		}) as typeof fetch
		const request = await signedRequest("/cgi-bin/media/uploadimg?access_token=test-token", bytes, {
			contentType: "multipart/form-data; boundary=safe-boundary",
		})

		const response = await handleRelayRequest(request, dependencies(upstream))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ url: "https://mmbiz.qpic.cn/image.jpg" })
		expect(upstream).toHaveBeenCalledTimes(1)
	})

	it("rejects unsigned and incorrectly signed requests", async () => {
		const unsigned = new Request("http://relay.local/v1/wechat", {
			method: "POST",
			body: "{}",
		})
		const signed = await signedRequest("/cgi-bin/stable_token")
		signed.headers.set("x-wechat-relay-signature", "0".repeat(64))
		const deps = dependencies()

		for (const request of [unsigned, signed]) {
			const response = await handleRelayRequest(request, deps)
			expect(response.status).toBe(401)
			await expectGenericError(response)
		}
		expect(deps.fetch).not.toHaveBeenCalled()
	})

	it("rejects expired requests and nonce replay", async () => {
		const nonce = "01234567-89ab-4def-8123-456789abcdef"
		const expired = await signedRequest("/cgi-bin/stable_token", undefined, {
			timestamp: String(Math.floor(now / 1000) - 61),
		})
		const first = await signedRequest("/cgi-bin/stable_token", undefined, { nonce })
		const second = await signedRequest("/cgi-bin/stable_token", undefined, { nonce })
		const deps = dependencies()

		expect((await handleRelayRequest(expired, deps)).status).toBe(401)
		expect((await handleRelayRequest(first, deps)).status).toBe(200)
		const replay = await handleRelayRequest(second, deps)
		expect(replay.status).toBe(409)
		await expectGenericError(replay)
		expect(deps.fetch).toHaveBeenCalledTimes(1)
	})

	it.each([
		"//evil.example/cgi-bin/draft/add?access_token=test",
		"/cgi-bin/freepublish/submit?access_token=test",
		"/cgi-bin/freepublish/get?access_token=test",
		"/cgi-bin/draft/add?access_token=test&unexpected=value",
		"/cgi-bin/draft/add?access_token=one&access_token=two",
		"/cgi-bin/material/add_material?access_token=test&type=video",
		"/cgi-bin/unknown?access_token=test",
	])("rejects a non-draft target: %s", async (target) => {
		const deps = dependencies()
		const response = await handleRelayRequest(await signedRequest(target), deps)

		expect(response.status).toBe(403)
		await expectGenericError(response)
		expect(deps.fetch).not.toHaveBeenCalled()
	})

	it("rejects mismatched signed and transport content types", async () => {
		const request = await signedRequest("/cgi-bin/stable_token")
		request.headers.set("content-type", "text/plain")
		const deps = dependencies()

		const response = await handleRelayRequest(request, deps)

		expect(response.status).toBe(401)
		expect(deps.fetch).not.toHaveBeenCalled()
	})

	it("rejects oversized request and response bodies", async () => {
		const oversizedRequest = await signedRequest(
			"/cgi-bin/stable_token",
			new Uint8Array(12_000_001)
		)
		const requestResponse = await handleRelayRequest(oversizedRequest, dependencies())
		expect(requestResponse.status).toBe(413)
		await expectGenericError(requestResponse)

		const upstream = vi
			.fn()
			.mockResolvedValue(new Response(new Uint8Array(2_000_001))) as typeof fetch
		const response = await handleRelayRequest(
			await signedRequest("/cgi-bin/stable_token"),
			dependencies(upstream)
		)
		expect(response.status).toBe(502)
		await expectGenericError(response)
	})

	it("rejects redirects and redacts upstream failures", async () => {
		for (const createUpstream of [
			() =>
				vi.fn().mockResolvedValue(
					new Response(null, {
						status: 302,
						headers: { location: "https://evil.example" },
					})
				),
			() => vi.fn().mockRejectedValue(new Error("unsafe upstream detail")),
		]) {
			const upstream = createUpstream() as typeof fetch
			const response = await handleRelayRequest(
				await signedRequest("/cgi-bin/stable_token"),
				dependencies(upstream)
			)
			expect(response.status).toBe(502)
			await expectGenericError(response)
		}
	})

	it("aborts an upstream request at the configured deadline", async () => {
		const upstream = vi.fn(
			(_input: RequestInfo | URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
						once: true,
					})
				})
		) as typeof fetch
		const response = await handleRelayRequest(
			await signedRequest("/cgi-bin/stable_token"),
			dependencies(upstream, { timeoutMs: 5 })
		)

		expect(response.status).toBe(502)
		await expectGenericError(response)
	})
})
