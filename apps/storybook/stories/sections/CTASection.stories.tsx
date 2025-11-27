import type { Meta, StoryObj } from "@storybook/react-vite"
import { CTASection } from "@repo/ui"

const meta: Meta<typeof CTASection> = {
	title: "Sections/CTASection",
	component: CTASection,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		style: {
			control: "select",
			options: ["primary", "accent"],
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		title: "Ready to Get Started?",
		description: "Join thousands of developers building amazing products with our platform.",
		buttonLabel: "Start Free Trial",
		buttonHref: "/signup",
		style: "primary",
	},
}

export const AccentStyle: Story = {
	args: {
		title: "Transform Your Workflow",
		description: "Experience the future of development with our cutting-edge tools.",
		buttonLabel: "See It In Action",
		buttonHref: "/demo",
		style: "accent",
	},
}

export const SimpleCall: Story = {
	args: {
		title: "Let's Build Something Great Together",
		buttonLabel: "Get Started",
		buttonHref: "/start",
		style: "primary",
	},
}

export const WithLongDescription: Story = {
	args: {
		title: "Take Your Business to the Next Level",
		description:
			"Our platform provides everything you need to scale your business, from powerful analytics to seamless integrations. Join thousands of satisfied customers who have transformed their operations with our solutions.",
		buttonLabel: "Schedule a Demo",
		buttonHref: "/contact",
		style: "primary",
	},
}
