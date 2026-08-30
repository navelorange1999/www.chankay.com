import { describe, expect, it } from "vitest"

import { resolveMiddlewareRewrite } from "../middleware"

describe("resolveMiddlewareRewrite", () => {
	it("rewrites the root path to the internal default-locale route", () => {
		expect(resolveMiddlewareRewrite("/")).toBe("/en")
	})

	it("rewrites unprefixed content paths", () => {
		expect(resolveMiddlewareRewrite("/posts/example")).toBe("/en/posts/example")
	})

	it("passes through supported locale prefixes", () => {
		expect(resolveMiddlewareRewrite("/zh-CN/posts/example")).toBeNull()
		expect(resolveMiddlewareRewrite("/en/posts/example")).toBeNull()
	})
})
