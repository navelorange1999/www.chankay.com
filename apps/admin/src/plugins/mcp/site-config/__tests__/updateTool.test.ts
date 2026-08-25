import { beforeEach, describe, expect, it, vi } from "vitest"

const { updateGlobal } = vi.hoisted(() => ({
	updateGlobal: vi.fn(),
}))

vi.mock("../../shared", () => {
	return {
		createTextResult: (value: unknown) => ({
			content: [{ text: JSON.stringify(value, null, 2), type: "text" }],
		}),
		getPayloadInstance: vi.fn(async () => ({ updateGlobal })),
		resolveGlobalLocale: (value: unknown) => value,
		resolveSupportedLocale: (value: unknown) =>
			value === "en" || value === "zh-CN" ? value : undefined,
	}
})

import { siteConfigTools } from "../index"
import { updateSiteConfigTool } from "../updateTool"

describe("update_site_config MCP tool", () => {
	beforeEach(() => {
		updateGlobal.mockReset()
	})

	it("updates the SiteConfig global for the requested locale", async () => {
		const data = { siteName: "展凯" }
		const siteConfig = { id: "site-config", siteName: "展凯" }
		updateGlobal.mockResolvedValue(siteConfig)

		const result = await updateSiteConfigTool.handler({
			data,
			locale: "zh-CN",
		})

		expect(updateGlobal).toHaveBeenCalledWith({
			data,
			locale: "zh-CN",
			overrideAccess: true,
			slug: "site-config",
		})
		expect(JSON.parse(result.content[0]!.text)).toEqual({
			action: "update_site_config",
			locale: "zh-CN",
			siteConfig,
		})
	})

	it("rejects unsupported locales before calling Payload", async () => {
		await expect(
			updateSiteConfigTool.handler({ data: { siteName: "Test" }, locale: "fr" })
		).rejects.toThrow("locale must be one of: en, zh-CN")
		expect(updateGlobal).not.toHaveBeenCalled()
	})

	it.each([undefined, null, [], {}, "invalid"])(
		"rejects an invalid SiteConfig patch: %j",
		async (data) => {
			await expect(updateSiteConfigTool.handler({ data, locale: "en" })).rejects.toThrow(
				"data must be a non-empty JSON object"
			)
			expect(updateGlobal).not.toHaveBeenCalled()
		}
	)

	it("propagates Payload validation failures", async () => {
		const validationError = new Error("Payload validation failed")
		updateGlobal.mockRejectedValue(validationError)

		await expect(
			updateSiteConfigTool.handler({ data: { siteUrl: "invalid" }, locale: "en" })
		).rejects.toBe(validationError)
	})

	it("registers read and update SiteConfig tools", () => {
		expect(siteConfigTools.map((tool) => tool.name)).toEqual([
			"get_site_config",
			"update_site_config",
		])
	})
})
