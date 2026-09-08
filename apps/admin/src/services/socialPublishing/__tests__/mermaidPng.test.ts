// @vitest-environment happy-dom
import { expect, it } from "vitest"
import { centerMindmapCircleLabels } from "../../../../../../packages/ui/src/utils/mermaidPng"

it("centers text in Mermaid circle nodes without shifting rectangular labels", () => {
	const doc = new DOMParser().parseFromString(
		'<svg xmlns="http://www.w3.org/2000/svg"><g class="mindmap-node"><circle/><g class="label" transform="translate(0, -9)"><text>Center</text></g></g><g class="mindmap-node"><path/><g class="label" transform="translate(-64, -9)"><text>Branch</text></g></g></svg>',
		"image/svg+xml"
	)
	centerMindmapCircleLabels(doc)
	expect(doc.querySelector("text")?.getAttribute("text-anchor")).toBe("middle")
	expect(doc.querySelectorAll("text")[1]?.hasAttribute("text-anchor")).toBe(false)
})
