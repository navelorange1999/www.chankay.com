import * as React from "react"

export interface ThemeProviderProps {
	children: React.ReactNode
	attribute?: string
	defaultTheme?: string
	enableSystem?: boolean
	storageKey?: string
	themes?: string[]
	forcedTheme?: string
	disableTransitionOnChange?: boolean
	enableColorScheme?: boolean
}

// Create a context for theme
const ThemeContext = React.createContext<{
	theme: string
	setTheme: (theme: string) => void
	resolvedTheme: string
	systemTheme: string
}>({
	theme: "light",
	setTheme: () => {},
	resolvedTheme: "light",
	systemTheme: "light",
})

// Mock ThemeProvider for Storybook
export function ThemeProvider({ children, defaultTheme = "light", ...props }: ThemeProviderProps) {
	const [theme, setTheme] = React.useState(defaultTheme)

	const value = React.useMemo(
		() => ({
			theme,
			setTheme,
			resolvedTheme: theme === "system" ? "light" : theme,
			systemTheme: "light",
		}),
		[theme]
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Mock useTheme hook for Storybook
export function useTheme() {
	const context = React.useContext(ThemeContext)

	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}

	return context
}
