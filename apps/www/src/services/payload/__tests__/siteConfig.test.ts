import { describe, expect, it, vi } from "vitest"

const { getGlobal } = vi.hoisted(() => ({ getGlobal: vi.fn() }))
vi.mock("@/utils/payloadClient", () => ({ payloadClient: { getGlobal } }))

import { getSiteConfig } from "../site-config"

describe("site configuration refresh", () => {
	it("passes the article refresh interval while retaining locale cache tags", async () => {
		await getSiteConfig("zh-CN", 60)
		expect(getGlobal).toHaveBeenCalledWith("site-config", {
			locale: "zh-CN",
			revalidate: 60,
			tags: ["global:site-config:zh-CN"],
		})
	})
})
