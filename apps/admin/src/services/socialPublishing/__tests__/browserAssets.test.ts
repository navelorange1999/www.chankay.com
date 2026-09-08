import { expect, it, vi } from "vitest"
import { prepareDiagramAssets } from "../../../components/socialPublishing/prepareDiagramAssets"

it("reads published content and uploads each unique diagram without updating the post", async () => {
	const definition = "flowchart LR\nA-->B"
	const content = "```mermaid\n" + definition + "\n```\n\n```mermaid\n" + definition + "\n```"
	const fetcher = vi
		.fn()
		.mockResolvedValueOnce(Response.json({ content }))
		.mockResolvedValueOnce(Response.json({ doc: { id: "media1" } }))
	const render = vi.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" }))
	const result = await prepareDiagramAssets("post", "zh-CN", render, fetcher)
	expect(result).toEqual([{ definition, mediaId: "media1" }])
	expect(String(fetcher.mock.calls[0]![0])).toContain("draft=false")
	expect(String(fetcher.mock.calls[0]![0])).toContain("fallback-locale=none")
	expect(fetcher.mock.calls[1]![0]).toBe("/api/media")
	expect(fetcher.mock.calls[1]![1].method).toBe("POST")
	expect(render).toHaveBeenCalledTimes(1)
})
it("stops before uploads when diagram rendering fails", async () => {
	const fetcher = vi.fn().mockResolvedValue(Response.json({ content: "```mermaid\ninvalid\n```" }))
	await expect(
		prepareDiagramAssets(
			"post",
			"zh-CN",
			async () => {
				throw new Error("Invalid diagram")
			},
			fetcher
		)
	).rejects.toThrow("Invalid diagram")
	expect(fetcher).toHaveBeenCalledTimes(1)
})
