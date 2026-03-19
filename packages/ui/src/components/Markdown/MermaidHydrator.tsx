"use client"

import * as React from "react"

type MermaidRenderer = typeof import("mermaid").default

export interface MermaidHydratorProps {
	containerId: string
}

let mermaidRendererPromise: Promise<MermaidRenderer> | null = null

function loadMermaidRenderer(): Promise<MermaidRenderer> {
	if (!mermaidRendererPromise) {
		mermaidRendererPromise = import("mermaid").then((module) => module.default)
	}

	return mermaidRendererPromise
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
}

export function MermaidHydrator({ containerId }: MermaidHydratorProps) {
	React.useEffect(() => {
		const container = document.getElementById(containerId)
		if (!container) return

		let isCancelled = false
		let renderRun = 0

		const renderMermaidDiagrams = async () => {
			const root = document.getElementById(containerId)
			if (!root) return

			const diagramNodes = Array.from(
				root.querySelectorAll<HTMLElement>("[data-mermaid-definition]")
			)

			if (diagramNodes.length === 0) return

			const currentRun = renderRun + 1
			renderRun = currentRun

			const mermaid = await loadMermaidRenderer()
			const isDarkTheme = document.documentElement.classList.contains("dark")

			mermaid.initialize({
				startOnLoad: false,
				securityLevel: "strict",
				theme: isDarkTheme ? "dark" : "default",
				flowchart: {
					curve: "linear",
					nodeSpacing: 48,
					rankSpacing: 72,
					useMaxWidth: true,
				},
			})

			for (const [index, node] of diagramNodes.entries()) {
				const encodedDefinition = node.dataset.mermaidDefinition
				if (!encodedDefinition) continue

				const definition = decodeURIComponent(encodedDefinition)

				try {
					const { svg } = await mermaid.render(`${containerId}-${currentRun}-${index}`, definition)

					if (isCancelled || renderRun !== currentRun) {
						return
					}

					node.innerHTML = svg

					const svgElement = node.querySelector("svg")
					if (svgElement) {
						svgElement.style.maxWidth = "100%"
						svgElement.style.height = "auto"
						svgElement.removeAttribute("width")
					}
				} catch {
					if (isCancelled || renderRun !== currentRun) {
						return
					}

					node.innerHTML = `<pre><code class="language-mermaid">${escapeHtml(definition)}</code></pre>`
				}
			}
		}

		void renderMermaidDiagrams()

		const observer = new MutationObserver(() => {
			void renderMermaidDiagrams()
		})

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "data-theme"],
		})

		return () => {
			isCancelled = true
			observer.disconnect()
		}
	}, [containerId])

	return null
}
