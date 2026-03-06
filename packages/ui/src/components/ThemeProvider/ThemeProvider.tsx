"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

import { getHighlightThemeCss, HIGHLIGHT_STYLE_ELEMENT_ID } from "./highlightThemeCss"

function syncHighlightTheme(theme: "light" | "dark") {
	const style =
		document.getElementById(HIGHLIGHT_STYLE_ELEMENT_ID) ??
		Object.assign(document.createElement("style"), { id: HIGHLIGHT_STYLE_ELEMENT_ID })

	if (!style.parentNode) {
		document.head.appendChild(style)
	}

	const css = getHighlightThemeCss(theme)

	if (style.textContent !== css) {
		style.textContent = css
	}

	style.setAttribute("data-theme", theme)
}

function HighlightJsThemeStyles() {
	const { resolvedTheme } = useNextTheme()

	React.useEffect(() => {
		syncHighlightTheme(resolvedTheme === "dark" ? "dark" : "light")
	}, [resolvedTheme])

	return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider {...props}>
			<HighlightJsThemeStyles />
			{children}
		</NextThemesProvider>
	)
}
