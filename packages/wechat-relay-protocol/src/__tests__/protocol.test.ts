import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"

import {
	canonicalRelayRequest,
	readRelayHeaders,
	signRelayRequest,
	verifyRelayRequest,
	type RelayMetadata,
} from "../index.js"

const secret = "s".repeat(32)
const metadata: RelayMetadata = {
	version: "1",
	timestamp: "1788912000",
	nonce: "01234567-89ab-4def-8123-456789abcdef",
	method: "POST",
	target: "/cgi-bin/draft/add?access_token=redacted-test-token",
	contentType: "application/json",
}
const body = new TextEncoder().encode('{"articles":[]}')

describe("relay request protocol", () => {
	it("uses one deterministic canonical field order", async () => {
		const signed = await signRelayRequest({ metadata, body, secret })
		const parsed = readRelayHeaders(signed)
		const canonical = canonicalRelayRequest(parsed.metadata, parsed.bodyHash)

		expect(canonical.split("\n")).toEqual([
			"1",
			"1788912000",
			"01234567-89ab-4def-8123-456789abcdef",
			"POST",
			"/cgi-bin/draft/add?access_token=redacted-test-token",
			"application/json",
			parsed.bodyHash,
		])
		expect(parsed.signature).toBe(createHmac("sha256", secret).update(canonical).digest("hex"))
	})

	it("verifies the signed bytes", async () => {
		const headers = await signRelayRequest({ metadata, body, secret })

		expect(await verifyRelayRequest({ headers, body, secret })).toBe(true)
	})

	it("rejects changed bytes", async () => {
		const headers = await signRelayRequest({ metadata, body, secret })

		expect(
			await verifyRelayRequest({
				headers,
				body: new TextEncoder().encode('{"articles":[{}]}'),
				secret,
			})
		).toBe(false)
	})

	it("rejects changed signed metadata", async () => {
		const headers = await signRelayRequest({ metadata, body, secret })
		headers.set("x-wechat-relay-target", "/cgi-bin/draft/get?access_token=changed")

		expect(await verifyRelayRequest({ headers, body, secret })).toBe(false)
	})

	it("rejects malformed hexadecimal fields", async () => {
		const headers = await signRelayRequest({ metadata, body, secret })
		headers.set("x-wechat-relay-signature", "not-hex")

		expect(() => readRelayHeaders(headers)).toThrow("Invalid relay headers.")
	})

	it("rejects short secrets and newline-bearing fields", async () => {
		await expect(signRelayRequest({ metadata, body, secret: "short" })).rejects.toThrow(
			"Invalid relay secret."
		)
		await expect(
			signRelayRequest({
				metadata: { ...metadata, target: `${metadata.target}\nforged` },
				body,
				secret,
			})
		).rejects.toThrow("Invalid relay metadata.")
	})
})
