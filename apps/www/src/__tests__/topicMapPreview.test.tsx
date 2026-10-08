import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TopicMapNode } from "@/components/nodes/TopicMapNode"
import { getTopicMap } from "@/services/payload/topicMap"

vi.mock("@/services/payload/topicMap", () => ({ getTopicMap: vi.fn() }))

const block = { enabled: true, title: "Topics" } as never

afterEach(() => vi.resetAllMocks())

describe("TopicMapNode preview", () => {
	it("shows an unavailable state for a failed public map request", async () => {
		vi.mocked(getTopicMap).mockResolvedValue(null)
		const node = await TopicMapNode({ block, locale: "en", isPreview: true })
		expect(renderToStaticMarkup(node)).toContain("Topic map is temporarily unavailable.")
	})

	it("distinguishes a valid empty map from an unavailable map", async () => {
		vi.mocked(getTopicMap).mockResolvedValue({ totals: { areaValue: 0 } } as never)
		const node = await TopicMapNode({ block, locale: "en", isPreview: true })
		expect(renderToStaticMarkup(node)).toContain("No published articles to display.")
	})

	it("omits an unavailable public map", async () => {
		vi.mocked(getTopicMap).mockResolvedValue(null)
		const node = await TopicMapNode({ block, locale: "en", isPreview: false })
		expect(node).toBeNull()
	})
})
