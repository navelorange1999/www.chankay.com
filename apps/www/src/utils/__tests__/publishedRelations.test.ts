import { describe, expect, it } from "vitest"

import { resolvePostTags } from "../posts"
import { resolveMedia } from "../seo"

describe("public relationship presentation", () => {
	it("omits withdrawn media and tag metadata", () => {
		expect(
			resolveMedia({ id: "image", _status: "draft", url: "https://example.com/image.png" })
		).toBeNull()
		expect(
			resolvePostTags({
				tags: [
					{ id: "published", name: "Public", _status: "published" },
					{ id: "draft", name: "Hidden", _status: "draft" },
				],
				primaryTag: { id: "legacy", name: "Legacy", _status: "draft" },
			} as never).map((tag) => tag.id)
		).toEqual(["published"])
	})
})
