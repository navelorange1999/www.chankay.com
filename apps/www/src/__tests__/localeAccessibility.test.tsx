import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { LocaleProvider, useLocale } from "@repo/ui/components/LocaleProvider"
import { LanguageSwitcher } from "@repo/ui/components/LanguageSwitcher"
import { Navbar } from "@repo/ui/components/Navbar"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

vi.mock("next/navigation", () => ({
	usePathname: () => "/zh-CN/posts",
}))

const siteConfig = {
	siteName: "ChanKay Blog",
	navigation: {
		menuItems: [{ label: "文章", url: "/zh-CN/posts" }],
	},
} as SiteConfig

function LocaleProbe() {
	const { locale, strings } = useLocale()
	return <span>{`${locale}:${strings.accessibility.websiteLogo}`}</span>
}

describe("locale accessibility context", () => {
	it("provides English strings without an explicit provider", () => {
		const markup = renderToStaticMarkup(<LocaleProbe />)

		expect(markup).toContain("en:Website logo")
	})

	it("provides Chinese strings to the language switcher", () => {
		const markup = renderToStaticMarkup(
			<LocaleProvider locale="zh-CN">
				<LocaleProbe />
				<LanguageSwitcher />
			</LocaleProvider>
		)

		expect(markup).toContain("zh-CN:网站标志")
		expect(markup).toContain('aria-label="选择语言"')
	})

	it("provides Chinese strings to the mobile navigation", () => {
		const markup = renderToStaticMarkup(
			<LocaleProvider locale="zh-CN">
				<Navbar siteConfig={siteConfig} currentLocale="zh-CN" />
			</LocaleProvider>
		)

		expect(markup).toContain('aria-label="切换移动端菜单"')
	})
})
