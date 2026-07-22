import { describe, expect, it } from "vitest"

import { formatPostDate, resolvePostDisplayTitle } from "../posts"

describe("post presentation helpers", () => {
	it("formats dates with the active locale", () => {
		const value = "2026-04-10T00:00:00.000Z"

		expect(formatPostDate(value, "en")).toBe("Apr 10, 2026")
		expect(formatPostDate(value, "zh-CN")).toBe("2026年4月10日")
	})

	it("localizes the untitled fallback", () => {
		expect(resolvePostDisplayTitle({ title: "" }, "en")).toBe("Untitled post")
		expect(resolvePostDisplayTitle({ title: "" }, "zh-CN")).toBe("未命名文章")
	})
})
