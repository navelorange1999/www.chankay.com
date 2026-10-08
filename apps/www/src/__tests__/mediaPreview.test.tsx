import { describe, expect, it } from "vitest"
import { MediaImageNode } from "@/components/nodes/MediaImageNode"
import { PreviewUrlNode } from "@/components/nodes/PreviewUrlNode"

const draft = { id: "draft-image", _status: "draft", url: "https://images.example.test/draft.png" }

describe("trusted media preview rendering", () => {
	it.each([MediaImageNode, PreviewUrlNode])(
		"shows draft media only for trusted preview props",
		(Node) => {
			const block = { media: draft, previewImage: draft } as never
			expect(Node({ block })).toBeNull()
			expect(Node({ block, isPreview: false })).toBeNull()
			expect(Node({ block, isPreview: true })).not.toBeNull()
		}
	)
	it.each([MediaImageNode, PreviewUrlNode])(
		"never renders unresolved media IDs even in preview",
		(Node) => {
			expect(
				Node({ block: { media: "missing", previewImage: "missing" } as never, isPreview: true })
			).toBeNull()
		}
	)
})
