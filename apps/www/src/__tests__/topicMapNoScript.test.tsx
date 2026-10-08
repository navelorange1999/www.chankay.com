import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { TopicMapExplorer } from "@/components/TopicMapExplorer"

vi.mock("@repo/ui/components/Treemap", () => ({ Treemap: () => null }))

describe("TopicMapExplorer without JavaScript", () => {
	it("keeps the complete data table visible while disabling interactive actions", () => {
		const markup = renderToStaticMarkup(
			<TopicMapExplorer
				locale="en"
				maxTopicsPerCategory={8}
				data={{
					schemaVersion: 1,
					metric: "tag-usages-with-untagged",
					locale: "en",
					generatedAt: "2026-01-01T00:00:00.000Z",
					totals: {
						publishedPostCount: 1,
						tagAssignmentCount: 1,
						untaggedPostCount: 0,
						areaValue: 1,
					},
					categories: [
						{
							id: "category",
							kind: "category",
							label: "Technical",
							publishedPostCount: 1,
							areaValue: 1,
							topics: [{ id: "category:tag", tagId: "tag", kind: "tag", label: "React", value: 1 }],
						},
					],
				}}
			/>
		)
		expect(markup).toContain("<table")
		expect(markup).toContain("Technical")
		expect(markup).toContain("React")
		expect(markup.match(/<button[^>]*disabled/g)).toHaveLength(2)
	})
})
