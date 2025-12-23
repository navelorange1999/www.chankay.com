import type { Preview } from "@storybook/react"
import * as React from "react"
import { ThemeProvider } from "@repo/ui"

import "../src/styles/global.css"

const ThemeWrapper = ({ children, theme }: { children: React.ReactNode; theme: string }) => {
	React.useEffect(() => {
		const root = document.documentElement
		if (theme === "dark") {
			root.classList.add("dark")
			root.style.colorScheme = "dark"
		} else {
			root.classList.remove("dark")
			root.style.colorScheme = "light"
		}
	}, [theme])

	return (
		<ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
			{children}
		</ThemeProvider>
	)
}

const preview: Preview = {
	decorators: [
		(Story, context) => {
			const theme = (context.globals.theme as string) || "light"

			return (
				<ThemeWrapper theme={theme}>
					<Story />
				</ThemeWrapper>
			)
		},
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
	globalTypes: {
		theme: {
			description: "Global theme for components",
			defaultValue: "light",
			toolbar: {
				title: "Theme",
				icon: "circlehollow",
				items: [
					{ value: "light", title: "Light", icon: "circlehollow" },
					{ value: "dark", title: "Dark", icon: "circle" },
				],
				showName: true,
				dynamicTitle: true,
			},
		},
	},
	tags: ["autodocs"],
}

export default preview
