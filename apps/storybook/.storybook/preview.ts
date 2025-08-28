// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, vue3-vite, etc.
import type { Preview } from "@storybook/react"

import "../src/styles/global.css"

const preview: Preview = {
	parameters: {
		// empty
	},
	tags: ["autodocs"],
}

export default preview
