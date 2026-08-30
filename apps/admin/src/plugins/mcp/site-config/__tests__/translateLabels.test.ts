import type { PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"

const payload = vi.hoisted(() => ({
	findGlobal: vi.fn(),
	updateGlobal: vi.fn(),
}))

vi.mock("../../shared", () => {
	return {
		createTextResult: (value: unknown) => ({
			content: [{ text: JSON.stringify(value), type: "text" }],
		}),
		resolveSupportedLocale: (value: unknown) =>
			value === "en" || value === "zh-CN" ? value : undefined,
	}
})

import { prepareLinkLabelsForLocale, translateSiteConfigLabelsTool } from "../translateLabels"

describe("prepareLinkLabelsForLocale", () => {
	it("prepares target-locale values while preserving ids and shared fields", () => {
		const result = prepareLinkLabelsForLocale({
			fieldName: "navigation.menuItems",
			items: [
				{
					external: false,
					id: "nav-demos",
					label: { en: "Demos" },
					showInMobile: true,
					url: "/demos",
				},
			],
			translations: [{ label: "演示", url: "/demos" }],
		})

		expect(result).toEqual([
			{
				external: false,
				id: "nav-demos",
				label: "演示",
				showInMobile: true,
				url: "/demos",
			},
		])
	})

	it("rejects an ambiguous existing URL", () => {
		expect(() =>
			prepareLinkLabelsForLocale({
				fieldName: "navigation.menuItems",
				items: [
					{ id: "first", label: { en: "First" }, url: "/same" },
					{ id: "second", label: { en: "Second" }, url: "/same" },
				],
				translations: [{ label: "重复", url: "/same" }],
			})
		).toThrow('Expected exactly one navigation.menuItems item for URL "/same", found 2.')
	})

	it("rejects a missing existing URL", () => {
		expect(() =>
			prepareLinkLabelsForLocale({
				fieldName: "navigation.menuItems",
				items: [{ id: "nav-demos", label: { en: "Demos" }, url: "/demos" }],
				translations: [{ label: "文章", url: "/posts" }],
			})
		).toThrow('Expected exactly one navigation.menuItems item for URL "/posts", found 0.')
	})

	it("rejects duplicate translation URLs", () => {
		expect(() =>
			prepareLinkLabelsForLocale({
				fieldName: "navigation.menuItems",
				items: [{ id: "nav-demos", label: { en: "Demos" }, url: "/demos" }],
				translations: [
					{ label: "演示", url: "/demos" },
					{ label: "示例", url: "/demos" },
				],
			})
		).toThrow('Duplicate translation URL "/demos" in navigation.menuItems.')
	})

	it("rejects partial array translations to avoid materializing fallback labels", () => {
		expect(() =>
			prepareLinkLabelsForLocale({
				fieldName: "navigation.menuItems",
				items: [
					{ id: "nav-demos", label: { en: "Demos" }, url: "/demos" },
					{ id: "nav-posts", label: { en: "Posts" }, url: "/posts" },
				],
				translations: [{ label: "演示", url: "/demos" }],
			})
		).toThrow('Missing translations for navigation.menuItems URLs: "/posts".')
	})
})

describe("translateSiteConfigLabelsTool", () => {
	beforeEach(() => {
		payload.findGlobal.mockReset()
		payload.updateGlobal.mockReset()
	})

	it("reads all locales and updates the requested locale while preserving array ids", async () => {
		const request = {
			payload,
			user: { id: "mcp-user" },
		} as unknown as PayloadRequest
		payload.findGlobal.mockResolvedValue({
			footer: {
				additionalLinks: [
					{ external: false, id: "footer-about", label: { en: "About" }, url: "/about" },
				],
				showBackToTop: true,
			},
			id: "site-config",
			navigation: {
				menuItems: [
					{
						external: false,
						id: "nav-demos",
						label: { en: "Demos" },
						showInMobile: true,
						url: "/demos",
					},
				],
				showSearch: true,
			},
		})
		payload.updateGlobal.mockResolvedValue({ id: "site-config" })

		await translateSiteConfigLabelsTool.handler(
			{
				footerLinkLabels: [{ label: "关于", url: "/about" }],
				locale: "zh-CN",
				navigationLabels: [{ label: "演示", url: "/demos" }],
			},
			request
		)

		expect(payload.findGlobal).toHaveBeenCalledWith({
			locale: "all",
			overrideAccess: false,
			req: request,
			slug: "site-config",
			user: request.user,
		})
		expect(payload.updateGlobal).toHaveBeenCalledWith({
			data: {
				footer: {
					additionalLinks: [
						{
							external: false,
							id: "footer-about",
							label: "关于",
							url: "/about",
						},
					],
				},
				navigation: {
					menuItems: [
						{
							external: false,
							id: "nav-demos",
							label: "演示",
							showInMobile: true,
							url: "/demos",
						},
					],
				},
			},
			locale: "zh-CN",
			overrideAccess: false,
			req: request,
			slug: "site-config",
			user: request.user,
		})
	})

	it("rejects unsupported locales before reading SiteConfig", async () => {
		const request = { payload, user: { id: "mcp-user" } } as unknown as PayloadRequest

		await expect(
			translateSiteConfigLabelsTool.handler(
				{
					locale: "fr",
					navigationLabels: [{ label: "Démos", url: "/demos" }],
				},
				request
			)
		).rejects.toThrow('Unsupported locale "fr".')
		expect(payload.findGlobal).not.toHaveBeenCalled()
		expect(payload.updateGlobal).not.toHaveBeenCalled()
	})

	it("rejects empty translation input before reading SiteConfig", async () => {
		const request = { payload, user: { id: "mcp-user" } } as unknown as PayloadRequest

		await expect(
			translateSiteConfigLabelsTool.handler({ locale: "zh-CN" }, request)
		).rejects.toThrow("At least one navigation or footer link label translation is required.")
		expect(payload.findGlobal).not.toHaveBeenCalled()
		expect(payload.updateGlobal).not.toHaveBeenCalled()
	})
})
