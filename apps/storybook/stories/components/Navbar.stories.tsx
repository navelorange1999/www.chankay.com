import type { Meta, StoryObj } from "@storybook/react-vite"
import { Navbar } from "@repo/ui"

// Storybook 会自动从 TypeScript 类型推断出所有 props
const meta = {
	title: "Components/Navbar",
	component: Navbar,
} satisfies Meta<typeof Navbar>

export default meta

type Story = StoryObj<typeof meta>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Default: Story = {
	args: {
		title: "Hello World",
		logo: "https://www.svgrepo.com/show/530488/share.svg",
		items: [
			{ label: "Home", href: "/" },
			{ label: "Blog", href: "/blog" },
			{ label: "About", href: "/about" },
		],
	},
}
