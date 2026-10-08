import { describe, expect, it } from "vitest"
import { resolveMedia } from "../seo"
describe("public relationship presentation", () => {
	it("omits withdrawn media", () => {
		expect(
			resolveMedia({ id: "image", _status: "draft", url: "https://example.com/image.png" })
		).toBeNull()
	})
})
