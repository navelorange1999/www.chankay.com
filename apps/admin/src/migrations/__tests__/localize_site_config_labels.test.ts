import { describe, expect, it } from "vitest"

import { transformSiteConfigLabels } from "../20260722120000_localize_site_config_labels"

describe("transformSiteConfigLabels", () => {
	it("wraps editor-controlled labels in the default locale", () => {
		const result = transformSiteConfigLabels(
			{
				navigation: {
					menuItems: [{ label: "About", url: "/about" }],
				},
				footer: {
					copyrightText: "All rights reserved.",
					additionalLinks: [{ label: "Privacy", url: "/privacy" }],
				},
			},
			true
		)

		expect(result.changedPaths).toEqual([
			"navigation.menuItems",
			"footer.copyrightText",
			"footer.additionalLinks",
		])
		expect(result.document).toMatchObject({
			navigation: {
				menuItems: [{ label: { en: "About" }, url: "/about" }],
			},
			footer: {
				copyrightText: { en: "All rights reserved." },
				additionalLinks: [{ label: { en: "Privacy" }, url: "/privacy" }],
			},
		})
	})

	it("leaves localized and empty values unchanged", () => {
		const result = transformSiteConfigLabels(
			{
				navigation: {
					menuItems: [{ label: { en: "About", "zh-CN": "关于" }, url: "/about" }],
				},
				footer: {
					copyrightText: null,
					additionalLinks: [],
				},
			},
			true
		)

		expect(result.changedPaths).toEqual([])
	})

	it("is idempotent when wrapping twice", () => {
		const first = transformSiteConfigLabels(
			{
				navigation: { menuItems: [{ label: "Posts", url: "/posts" }] },
			},
			true
		)
		const second = transformSiteConfigLabels(first.document, true)

		expect(first.changedPaths).toEqual(["navigation.menuItems"])
		expect(second.changedPaths).toEqual([])
		expect(second.document).toEqual(first.document)
	})

	it("unwraps default-locale values on rollback", () => {
		const result = transformSiteConfigLabels(
			{
				footer: {
					copyrightText: { en: "Copyright", "zh-CN": "版权" },
					additionalLinks: [{ label: { en: "Terms", "zh-CN": "条款" } }],
				},
			},
			false
		)

		expect(result.document).toMatchObject({
			footer: {
				copyrightText: "Copyright",
				additionalLinks: [{ label: "Terms" }],
			},
		})
	})
})
