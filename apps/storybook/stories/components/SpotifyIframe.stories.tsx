import type { Meta, StoryObj } from "@storybook/react-vite"
import { SpotifyIframe } from "@repo/ui"

const meta: Meta<typeof SpotifyIframe> = {
	title: "Components/SpotifyIframe",
	component: SpotifyIframe,
	tags: ["autodocs"],
	argTypes: {
		uri: {
			control: "text",
		},
		height: {
			control: "number",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		uri: "spotify:playlist:1QN4xOT2GOWvVpIBzqP9zb",
		height: 352,
		className: "max-w-2xl",
	},
	render: (args) => (
		<div className="p-6">
			<SpotifyIframe {...args} />
		</div>
	),
}
