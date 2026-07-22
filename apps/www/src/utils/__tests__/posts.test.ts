import { describe, expect, it } from "vitest"

import {
	formatPostDate,
	resolvePostDisplayTitle,
	resolvePostSeoDescription,
	resolvePostSeoTitle,
} from "../posts"

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

	it("localizes SEO fallbacks", () => {
		const post = { excerpt: "", meta: {}, title: "" }

		expect(resolvePostSeoTitle(post, "zh-CN")).toBe("未命名文章")
		expect(
			resolvePostSeoDescription(post, {
				siteDescription: "中文站点描述",
			})
		).toBe("中文站点描述")
	})
})
