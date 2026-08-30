import { describe, expect, it } from "vitest"

import {
	buildRouteAlternates,
	formatLocalizedDate,
	formatReadingTime,
	getUiStrings,
	resolveLocalizedPath,
	stripLocalePrefix,
} from "../index.js"

describe("localized paths", () => {
	it("keeps the default locale unprefixed", () => {
		expect(resolveLocalizedPath("en", "/posts/example")).toBe("/posts/example")
	})

	it("prefixes non-default locales without duplicating existing prefixes", () => {
		expect(resolveLocalizedPath("zh-CN", "/posts/example")).toBe("/zh-CN/posts/example")
		expect(resolveLocalizedPath("zh-CN", "/en/posts/example")).toBe("/zh-CN/posts/example")
	})

	it("strips supported locale prefixes", () => {
		expect(stripLocalePrefix("/zh-CN/posts/example")).toEqual({
			locale: "zh-CN",
			path: "/posts/example",
		})
	})
})

describe("route alternates", () => {
	it("builds canonical, locale, and x-default URLs", () => {
		expect(
			buildRouteAlternates({
				currentLocale: "zh-CN",
				domain: "posts",
				siteUrl: "https://www.chankay.com",
				slug: "example",
			})
		).toEqual({
			canonical: "https://www.chankay.com/zh-CN/posts/example",
			languages: {
				en: "https://www.chankay.com/posts/example",
				"zh-CN": "https://www.chankay.com/zh-CN/posts/example",
				"x-default": "https://www.chankay.com/posts/example",
			},
		})
	})
})

describe("interface strings", () => {
	it("returns complete English and Chinese dictionaries", () => {
		expect(getUiStrings("en").posts.readPost).toBe("Read post")
		expect(getUiStrings("zh-CN").posts.readPost).toBe("阅读文章")
		expect(getUiStrings("zh-CN").article.onThisPage).toBe("本文目录")
		expect(getUiStrings("zh-CN").notFound.title).toBe("404 - 页面未找到")
		expect(getUiStrings("zh-CN").untitledPost).toBe("未命名文章")
	})
})

describe("locale-aware formatting", () => {
	it("formats dates using the requested locale", () => {
		const value = "2026-04-10T00:00:00.000Z"

		expect(formatLocalizedDate(value, "en")).toBe("Apr 10, 2026")
		expect(formatLocalizedDate(value, "zh-CN")).toBe("2026年4月10日")
	})

	it("returns undefined for invalid dates", () => {
		expect(formatLocalizedDate("invalid", "en")).toBeUndefined()
		expect(formatLocalizedDate(undefined, "zh-CN")).toBeUndefined()
	})

	it("formats reading time using the requested locale", () => {
		expect(formatReadingTime(3, "en")).toBe("3 min read")
		expect(formatReadingTime(3, "zh-CN")).toBe("阅读 3 分钟")
	})
})
