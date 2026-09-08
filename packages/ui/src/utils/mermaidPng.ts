"use client"

export function centerMindmapCircleLabels(document: Document) {
	// Mermaid 11.13 centers circle label groups at x=0 but omits the text anchor.
	for (const node of document.querySelectorAll("g.mindmap-node")) {
		if (!node.querySelector(":scope > circle")) continue
		for (const text of node.querySelectorAll("g.label text"))
			text.setAttribute("text-anchor", "middle")
	}
}

// Render strict Mermaid SVG without HTML labels so the result can be rasterized safely.
export async function renderMermaidPng(definition: string): Promise<Blob> {
	if (!definition || definition.length > 10000 || /%%\{|^---/m.test(definition))
		throw new Error("Unsupported diagram configuration.")
	const mermaid = (await import("mermaid")).default
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: "default",
		htmlLabels: false,
		fontFamily: "Arial, PingFang SC, sans-serif",
		flowchart: { htmlLabels: false, useMaxWidth: false },
	})
	const { svg } = await mermaid.render(`diagram-${crypto.randomUUID()}`, definition)
	const document = new DOMParser().parseFromString(svg, "image/svg+xml")
	const element = document.documentElement
	if (document.querySelector("parsererror, foreignObject, script, image"))
		throw new Error("Diagram contains unsupported image content.")
	centerMindmapCircleLabels(document)
	const bounds = element
		.getAttribute("viewBox")
		?.split(/[\s,]+/)
		.map(Number)
	if (
		!bounds ||
		bounds.length !== 4 ||
		!bounds.every(Number.isFinite) ||
		bounds[2]! <= 0 ||
		bounds[3]! <= 0
	)
		throw new Error("Diagram dimensions are unavailable.")
	const scale = Math.min(2, 1800 / bounds[2]!, 2400 / bounds[3]!)
	const width = Math.ceil(bounds[2]! * scale)
	const height = Math.ceil(bounds[3]! * scale)
	element.setAttribute("width", String(width))
	element.setAttribute("height", String(height))
	element.removeAttribute("style")
	const url = URL.createObjectURL(
		new Blob([new XMLSerializer().serializeToString(element)], { type: "image/svg+xml" })
	)
	try {
		const image = new Image()
		image.src = url
		await image.decode()
		const canvas = window.document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		const context = canvas.getContext("2d")
		if (!context) throw new Error("Image export is unavailable.")
		context.fillStyle = "white"
		context.fillRect(0, 0, width, height)
		context.drawImage(image, 0, 0, width, height)
		return await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error("Diagram image export failed."))),
				"image/png"
			)
		)
	} finally {
		URL.revokeObjectURL(url)
	}
}
