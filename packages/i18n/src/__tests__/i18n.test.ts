import { describe, expect, it } from "vitest"

import {
	buildRouteAlternates,
	buildRouteIndexAlternates,
	formatLocalizedDate,
	formatReadingTime,
	getUiStrings,
	resolveLocalizedPath,
	resolveRouteIndexPath,
	resolveRoutePath,
	stripLocalePrefix,
} from "../index.js"

describe("localized paths", () => {
	it("keeps the default locale unprefixed", () => {
		expect(resolveLocalizedPath("en", "/technical/example")).toBe("/technical/example")
	})

	it("prefixes non-default locales without duplicating existing prefixes", () => {
		expect(resolveLocalizedPath("zh-CN", "/technical/example")).toBe("/zh-CN/technical/example")
		expect(resolveLocalizedPath("zh-CN", "/en/technical/example")).toBe("/zh-CN/technical/example")
	})

	it("strips supported locale prefixes", () => {
		expect(stripLocalePrefix("/zh-CN/technical/example")).toEqual({
			locale: "zh-CN",
			path: "/technical/example",
		})
	})
})

describe("route alternates", () => {
	it("builds canonical, locale, and x-default URLs", () => {
		expect(
			buildRouteAlternates({
				currentLocale: "zh-CN",
				domain: "technical",
				siteUrl: "https://www.chankay.com",
				slug: "example",
			})
		).toEqual({
			canonical: "https://www.chankay.com/zh-CN/technical/example",
			languages: {
				en: "https://www.chankay.com/technical/example",
				"zh-CN": "https://www.chankay.com/zh-CN/technical/example",
				"x-default": "https://www.chankay.com/technical/example",
			},
		})
	})

	it("builds section index routes and alternates", () => {
		expect(resolveRouteIndexPath("technical", "en")).toBe("/technical")
		expect(resolveRouteIndexPath("trading", "zh-CN")).toBe("/zh-CN/trading")
		expect(resolveRoutePath("technical", "architecture", "en")).toBe("/technical/architecture")
		expect(resolveRoutePath("trading", "market-view", "zh-CN")).toBe("/zh-CN/trading/market-view")
		expect(
			buildRouteIndexAlternates({
				currentLocale: "zh-CN",
				domain: "trading",
				siteUrl: "https://www.chankay.com",
			})
		).toEqual({
			canonical: "https://www.chankay.com/zh-CN/trading",
			languages: {
				en: "https://www.chankay.com/trading",
				"zh-CN": "https://www.chankay.com/zh-CN/trading",
				"x-default": "https://www.chankay.com/trading",
			},
		})
	})
})

describe("interface strings", () => {
	it("returns complete English and Chinese dictionaries", () => {
		expect(getUiStrings("en").postSection.readPost).toBe("Read article")
		expect(getUiStrings("zh-CN").article.backToSection).toBe("返回板块")
		expect(getUiStrings("zh-CN").article.onThisPage).toBe("本文目录")
		expect(getUiStrings("zh-CN").notFound.title).toBe("404 - 页面未找到")
		expect(getUiStrings("zh-CN").untitledPost).toBe("未命名文章")
	})

	it("returns localized accessibility strings", () => {
		expect(getUiStrings("en").accessibility).toEqual({
			closeLanguageMenu: "Close language menu",
			closeThemeMenu: "Close theme menu",
			followOn: "Follow us on {platform}",
			home: "Home",
			selectLanguage: "Select language",
			selectTheme: "Select theme",
			toggleMobileMenu: "Toggle mobile menu",
			toggleTheme: "Toggle theme",
			websiteLogo: "Website logo",
		})
		expect(getUiStrings("zh-CN").accessibility).toEqual({
			closeLanguageMenu: "关闭语言菜单",
			closeThemeMenu: "关闭主题菜单",
			followOn: "在 {platform} 上关注我们",
			home: "首页",
			selectLanguage: "选择语言",
			selectTheme: "选择主题",
			toggleMobileMenu: "切换移动端菜单",
			toggleTheme: "切换主题",
			websiteLogo: "网站标志",
		})
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
