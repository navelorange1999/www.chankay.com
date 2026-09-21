import { describe, expect, it, vi } from "vitest"
vi.mock("../../handwriting/service", () => ({ ensureHandwriting: vi.fn() }))
vi.mock("../../handwriting/revalidate", () => ({ revalidateHandwriting: vi.fn() }))
import { collectHandwritingInputs, prepareHandwritingPage } from "../handwriting"

describe("handwriting page preparation", () => {
	it("finds both container children and card content blocks", () => {
		const inputs = collectHandwritingInputs([
			{
				blockType: "container",
				children: [
					{ blockType: "card", contentBlocks: [{ blockType: "handWriting", text: "Inside card" }] },
				],
			},
		])
		expect(inputs.map((input) => input.text)).toEqual(["Inside card"])
	})

	it("re-reads a newer save and generates its artifact before returning a writable snapshot", async () => {
		const page = (text: string) => ({
			id: "page",
			structure: [{ blockType: "handWriting", text }],
			seo: { metaTitle: text, ogGenerationStatus: "queued" },
		})
		const a = page("First"),
			b = page("Second")
		const generated: string[] = []
		const result = await prepareHandwritingPage(a, {
			load: async () => b,
			generate: async (structure) => {
				generated.push(collectHandwritingInputs(structure)[0]!.text)
			},
		})
		expect(generated).toEqual(["First", "Second"])
		expect(result).toEqual(b)
		expect(result?.seo.metaTitle).toBe("Second")
	})

	it("stops when the page is deleted during generation", async () => {
		const result = await prepareHandwritingPage(
			{ structure: [] },
			{ load: async () => null, generate: async () => {} }
		)
		expect(result).toBeNull()
	})
})
