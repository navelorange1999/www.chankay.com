import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { LanguageSwitcher } from "@repo/ui/components/LanguageSwitcher"

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
}))

describe("LanguageSwitcher", () => {
	it("shows the current locale's native name in the trigger", () => {
		const markup = renderToStaticMarkup(<LanguageSwitcher currentLocale="en" />)
		const trigger = markup.match(/<button[^>]*aria-label="Select language"[^>]*>(.*?)<\/button>/)

		expect(trigger?.[1]).toContain("English")
	})

	it("does not render locale flags", () => {
		const markup = renderToStaticMarkup(<LanguageSwitcher currentLocale="en" />)

		expect(markup).not.toContain("🇺🇸")
		expect(markup).not.toContain("🇨🇳")
	})

	it("pairs the trigger hover background with its foreground color", () => {
		const markup = renderToStaticMarkup(<LanguageSwitcher currentLocale="en" />)
		const trigger = markup.match(/<button[^>]*class="([^"]*)"[^>]*aria-label="Select language"/)

		expect(trigger?.[1]).toContain("hover:bg-accent")
		expect(trigger?.[1]).toContain("hover:text-accent-foreground")
	})

	it("pairs option state backgrounds with their foreground color", () => {
		const markup = renderToStaticMarkup(<LanguageSwitcher currentLocale="en" />)
		const activeOption = markup.match(/<a class="([^"]*)" hrefLang="en"/)

		expect(activeOption?.[1]).toContain("bg-accent")
		expect(activeOption?.[1]).toContain("text-accent-foreground")
		expect(activeOption?.[1]).toContain("hover:bg-accent")
		expect(activeOption?.[1]).toContain("hover:text-accent-foreground")
	})
})
