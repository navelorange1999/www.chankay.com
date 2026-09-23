// @vitest-environment happy-dom

import * as React from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MermaidHydrator } from "../../../../packages/ui/src/components/Markdown/MermaidHydrator"
import { useThemeTransition } from "../../../../packages/ui/src/hooks/useThemeTransition"
import type { ThemeMode } from "../../../../packages/ui/src/hooks/useTheme"

const mermaid = vi.hoisted(() => ({
	initialize: vi.fn(),
	render: vi.fn(async () => ({ svg: "<svg><text>Diagram</text></svg>" })),
}))

vi.mock("../../../../packages/ui/node_modules/mermaid", () => ({ default: mermaid }))

let host: HTMLDivElement
let root: Root

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
	document.documentElement.className = "light"
	document.documentElement.dataset.theme = "light"
	host = document.createElement("div")
	document.body.append(host)
	root = createRoot(host)
	vi.clearAllMocks()
})

afterEach(async () => {
	await act(async () => root.unmount())
	host.remove()
	document.documentElement.removeAttribute("data-theme-transition")
	Reflect.deleteProperty(document, "startViewTransition")
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe("theme rendering", () => {
	it("commits theme-dependent React content before the view transition takes its snapshot", async () => {
		let updateSnapshot: (() => void) | undefined
		Object.defineProperty(document, "startViewTransition", {
			configurable: true,
			value: (update: () => void) => {
				updateSnapshot = update
				return { ready: new Promise(() => {}), finished: new Promise(() => {}) }
			},
		})

		function ThemeContent() {
			const [theme, setTheme] = React.useState<ThemeMode>("light")
			const { runThemeTransition } = useThemeTransition({
				resolvedTheme: theme === "dark" ? "dark" : "light",
				setTheme,
			})
			return <button onClick={() => runThemeTransition("dark")}>{theme}</button>
		}

		await act(async () => root.render(<ThemeContent />))
		await act(async () => host.querySelector("button")!.click())
		expect(updateSnapshot).toBeTypeOf("function")
		let snapshotText: string | null = null
		await act(async () => {
			updateSnapshot!()
			snapshotText = host.textContent
		})
		expect(document.documentElement.dataset.theme).toBe("dark")
		expect(snapshotText).toBe("dark")
	})

	it("does not redraw diagrams when next-themes repeats the same resolved theme", async () => {
		await act(async () =>
			root.render(
				<div id="article">
					<div data-mermaid-definition={encodeURIComponent("graph TD; A-->B")} />
					<MermaidHydrator containerId="article" />
				</div>
			)
		)
		await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(1))
		document.documentElement.className = "dark"
		document.documentElement.dataset.theme = "dark"
		await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2))

		// next-themes writes the root attributes again after its React state commits.
		document.documentElement.className = "dark"
		document.documentElement.dataset.theme = "dark"
		await new Promise((resolve) => setTimeout(resolve, 20))
		expect(mermaid.render).toHaveBeenCalledTimes(2)
		expect(host.querySelector("svg")?.textContent).toBe("Diagram")

		document.documentElement.className = "light"
		document.documentElement.dataset.theme = "light"
		await vi.waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(3))
		expect(mermaid.initialize).toHaveBeenLastCalledWith(
			expect.objectContaining({ theme: "default" })
		)
	})
})
