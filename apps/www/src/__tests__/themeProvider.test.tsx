import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ThemeProvider, ThemeScript } from "../../../../packages/ui/src/components/ThemeProvider"

describe("ThemeProvider", () => {
	it("configures next-themes to synchronize class and data-theme", () => {
		const markup = renderToStaticMarkup(
			<ThemeProvider defaultTheme="system" enableSystem>
				<div />
			</ThemeProvider>
		)

		expect(markup).toContain('["class","data-theme"],"theme"')
	})

	it("uses the same root class contract during first paint", () => {
		const markup = renderToStaticMarkup(<ThemeScript />)

		expect(markup).toContain("root.classList.remove('light', 'dark')")
		expect(markup).toContain("root.classList.add(resolvedTheme)")
	})
})
