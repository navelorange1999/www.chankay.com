import { describe, expect, it } from "vitest"

import { NonceStore } from "../nonceStore.js"

describe("relay nonce store", () => {
	it("accepts a nonce once within its lifetime", () => {
		const store = new NonceStore()

		expect(store.consume("nonce-0000000001", 2000, 1000)).toBe(true)
		expect(store.consume("nonce-0000000001", 2000, 1001)).toBe(false)
	})

	it("accepts a nonce after its previous entry expires", () => {
		const store = new NonceStore()
		store.consume("nonce-0000000001", 2000, 1000)

		expect(store.consume("nonce-0000000001", 3000, 2000)).toBe(true)
	})

	it("evicts the oldest entry at the configured bound", () => {
		const store = new NonceStore(2)
		store.consume("nonce-0000000001", 5000, 1000)
		store.consume("nonce-0000000002", 5000, 1001)
		store.consume("nonce-0000000003", 5000, 1002)

		expect(store.consume("nonce-0000000001", 5000, 1003)).toBe(true)
		expect(store.consume("nonce-0000000003", 5000, 1003)).toBe(false)
	})

	it("rejects invalid constructor and time values", () => {
		expect(() => new NonceStore(0)).toThrow("Invalid nonce store configuration.")
		const store = new NonceStore()
		expect(() => store.consume("nonce-0000000001", Number.NaN, 1000)).toThrow(
			"Invalid nonce lifetime."
		)
	})
})
