import { describe, expect, it } from "vitest"

import { readRelayConfig } from "../config.js"

const secret = "s".repeat(32)

describe("relay configuration", () => {
	it("defaults to a loopback listener", () => {
		expect(readRelayConfig({ WECHAT_RELAY_SHARED_SECRET: secret })).toEqual({
			host: "127.0.0.1",
			port: 8787,
			sharedSecret: secret,
		})
	})

	it.each([
		{},
		{ WECHAT_RELAY_SHARED_SECRET: "short" },
		{ WECHAT_RELAY_SHARED_SECRET: secret, WECHAT_RELAY_HOST: "public.example.com" },
		{ WECHAT_RELAY_SHARED_SECRET: secret, WECHAT_RELAY_PORT: "80" },
		{ WECHAT_RELAY_SHARED_SECRET: secret, WECHAT_RELAY_PORT: "not-a-port" },
		{ WECHAT_RELAY_SHARED_SECRET: secret, WECHAT_RELAY_PORT: "65536" },
	])("rejects unsafe configuration without returning values: %j", (environment) => {
		expect(() => readRelayConfig(environment)).toThrow("Invalid relay configuration.")
	})

	it("allows the container listener override", () => {
		expect(
			readRelayConfig({
				WECHAT_RELAY_SHARED_SECRET: secret,
				WECHAT_RELAY_HOST: "0.0.0.0",
				WECHAT_RELAY_PORT: "8788",
			})
		).toMatchObject({ host: "0.0.0.0", port: 8788 })
	})
})
