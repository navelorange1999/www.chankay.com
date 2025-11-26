import type { Preview } from "@storybook/react"
import * as React from "react"
import { ThemeProvider } from "@repo/ui"

import "../src/styles/global.css"

const preview: Preview = {
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<Story />
			</ThemeProvider>
		),
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
	tags: ["autodocs"],
}

export default preview
