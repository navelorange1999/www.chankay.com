"use client"

import { useTheme as useNextThemes } from "next-themes"
import { useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"

export interface ThemeState {
	theme: ThemeMode
	resolvedTheme: "light" | "dark"
	systemTheme: "light" | "dark"
	mounted: boolean
	setTheme: (theme: ThemeMode) => void
	toggleTheme: () => void
	cycleTheme: () => void
	isDark: boolean
	isLight: boolean
	isSystem: boolean
}

export function useTheme(): ThemeState {
	const { theme, resolvedTheme, systemTheme, setTheme: setNextTheme } = useNextThemes()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const setTheme = (newTheme: ThemeMode) => {
		setNextTheme(newTheme)
	}

	const toggleTheme = () => {
		if (theme === "light") {
			setTheme("dark")
		} else if (theme === "dark") {
			setTheme("system")
		} else {
			setTheme("light")
		}
	}

	const cycleTheme = () => {
		const themes: ThemeMode[] = ["light", "dark", "system"]
		const currentTheme = (theme as ThemeMode) || "system"
		const currentIndex = themes.indexOf(currentTheme)
		const nextIndex = (currentIndex + 1) % themes.length
		const nextTheme = themes[nextIndex]
		if (nextTheme) {
			setTheme(nextTheme)
		}
	}

	return {
		theme: (theme as ThemeMode) || "system",
		resolvedTheme: (resolvedTheme as "light" | "dark") || "light",
		systemTheme: (systemTheme as "light" | "dark") || "light",
		mounted,
		setTheme,
		toggleTheme,
		cycleTheme,
		isDark: resolvedTheme === "dark",
		isLight: resolvedTheme === "light",
		isSystem: theme === "system",
	}
}
