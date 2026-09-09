import { readRelayHeaders, verifyRelayRequest } from "@chankay/wechat-relay-protocol"
import { describe, expect, it, vi } from "vitest"

import { createWeChatRelayFetch } from "../relayTransport"

const secret = "s".repeat(32)
const relayURL = "https://wechat-relay.chankay.com/v1/wechat"
const now = 1_788_912_000_000
const nonce = "01234567-89ab-4def-8123-456789abcdef"

const environment = {
	WECHAT_RELAY_URL: relayURL,
	WECHAT_RELAY_SHARED_SECRET: secret,
}

describe("WeChat relay transport", () => {
	it("returns the direct fetch when relay configuration is absent", () => {
		const directFetch = vi.fn() as unknown as typeof fetch

		expect(createWeChatRelayFetch({}, directFetch)).toBe(directFetch)
	})

	it.each([
		{ WECHAT_RELAY_URL: relayURL },
		{ WECHAT_RELAY_SHARED_SECRET: secret },
		{ ...environment, WECHAT_RELAY_URL: "http://wechat-relay.chankay.com/v1/wechat" },
		{ ...environment, WECHAT_RELAY_URL: `${relayURL}?unsafe=true` },
		{ ...environment, WECHAT_RELAY_URL: "https://user@example.com/v1/wechat" },
		{ ...environment, WECHAT_RELAY_URL: "https://example.com/other" },
		{ ...environment, WECHAT_RELAY_SHARED_SECRET: "short" },
	])("rejects invalid configuration without making a request", async (configured) => {
		const baseFetch = vi.fn() as unknown as typeof fetch
		const fetcher = createWeChatRelayFetch(configured, baseFetch)

		await expect(
			fetcher("https://api.weixin.qq.com/cgi-bin/stable_token", {
				method: "POST",
				body: "{}",
			})
		).rejects.toThrow("Invalid WeChat relay configuration.")
		expect(baseFetch).not.toHaveBeenCalled()
	})

	it.each([
		"https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=test",
		"https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=test",
		"https://evil.example/cgi-bin/draft/add?access_token=test",
		"https://api.weixin.qq.com/cgi-bin/unknown?access_token=test",
	])("rejects a request outside the draft allowlist: %s", async (target) => {
		const baseFetch = vi.fn() as unknown as typeof fetch
		const fetcher = createWeChatRelayFetch(environment, baseFetch)

		await expect(fetcher(target, { method: "POST", body: "{}" })).rejects.toThrow(
			"Invalid WeChat relay request."
		)
		expect(baseFetch).not.toHaveBeenCalled()
	})

	it("routes exact multipart bytes through the configured relay", async () => {
		const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
		const baseFetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(String(input)).toBe(relayURL)
			expect(init?.method).toBe("POST")
			expect(init?.redirect).toBe("error")
			expect(new Headers(init?.headers).get("content-type")).toBe(
				"multipart/form-data; boundary=safe-boundary"
			)
			const sent = new Uint8Array(await new Response(init?.body).arrayBuffer())
			expect(sent).toEqual(bytes)
			const headers = new Headers(init?.headers)
			expect(readRelayHeaders(headers).metadata).toMatchObject({
				version: "1",
				timestamp: String(Math.floor(now / 1000)),
				nonce,
				method: "POST",
				target: "/cgi-bin/media/uploadimg?access_token=test",
				contentType: "multipart/form-data; boundary=safe-boundary",
			})
			expect(await verifyRelayRequest({ headers, body: sent, secret })).toBe(true)
			return Response.json({ url: "https://mmbiz.qpic.cn/image.jpg" })
		})
		const baseFetch = baseFetchMock as typeof fetch
		const controller = new AbortController()
		const fetcher = createWeChatRelayFetch(environment, baseFetch, {
			now: () => now,
			nonce: () => nonce,
		})

		const response = await fetcher(
			"https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=test",
			{
				method: "POST",
				headers: { "content-type": "multipart/form-data; boundary=safe-boundary" },
				body: bytes,
				signal: controller.signal,
			}
		)

		expect(await response.json()).toEqual({ url: "https://mmbiz.qpic.cn/image.jpg" })
		expect(baseFetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
	})
})
