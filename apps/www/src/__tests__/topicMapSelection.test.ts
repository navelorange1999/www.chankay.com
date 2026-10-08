import { describe, expect, it } from "vitest"

import { resolveTopicMapSelection } from "@/services/payload/topicMapSelection"

describe("resolveTopicMapSelection", () => {
	it("uses refreshed labels for a selection whose IDs remain published", () => {
		const selected = {
			category: { id: "category", label: "Old category" },
			topic: { id: "category:tag", label: "Old tag" },
		}
		const currentCategory = {
			id: "category",
			label: "New category",
			topics: [{ id: "category:tag", label: "New tag" }],
		}
		expect(resolveTopicMapSelection([currentCategory], selected)).toEqual({
			category: currentCategory,
			topic: currentCategory.topics[0],
		})
	})

	it("closes a selection withdrawn from the refreshed map", () => {
		const selected = {
			category: { id: "category", label: "Category" },
			topic: { id: "category:tag", label: "Tag" },
		}
		expect(resolveTopicMapSelection([], selected)).toBeNull()
	})
})
