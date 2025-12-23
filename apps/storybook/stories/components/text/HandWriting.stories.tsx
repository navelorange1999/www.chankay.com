import type { Meta, StoryObj } from "@storybook/react-vite"
import { HandWriting } from "@repo/ui"

const meta: Meta<typeof HandWriting> = {
	title: "Components/Text/HandWriting",
	component: HandWriting,
	tags: ["autodocs"],
	args: {
		speed: 1,
		className: "min-h-[260px] min-w-[260px]",
	},
	argTypes: {
		speed: {
			control: "number",
			description: "Animation speed multiplier",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
			table: {
				defaultValue: { summary: "min-h-[260px] min-w-[260px]" },
			},
		},
		svgClassName: {
			control: "text",
			description: "Additional CSS classes for the SVG element",
			table: {
				defaultValue: { summary: "w-[260px] md:w-[360px]" },
			},
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {},
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
		className: "h-64 w-128",
		svgClassName: "w-128 md:w-[360px]",
	},
}
