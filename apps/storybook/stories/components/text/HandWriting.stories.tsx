import type { Meta, StoryObj } from "@storybook/react-vite"
import { HandWriting } from "@repo/ui"

const meta: Meta<typeof HandWriting> = {
	title: "Components/Text/HandWriting",
	component: HandWriting,
	tags: ["autodocs"],
	argTypes: {
		speed: {
			control: "number",
			description: "Animation speed multiplier",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		speed: 1,
	},
}

export const Slow: Story = {
	args: {
		speed: 0.5,
	},
}

export const Fast: Story = {
	args: {
		speed: 2,
	},
}

export const CustomSize: Story = {
	args: {
		speed: 1,
		className: "h-32",
	},
}

export const WithCallback: Story = {
	args: {
		speed: 1,
		onAnimationComplete: () => {
			console.log("Animation completed!")
		},
	},
}
