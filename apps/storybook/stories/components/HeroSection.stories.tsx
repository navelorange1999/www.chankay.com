import type { Meta, StoryObj } from "@storybook/react-vite"
import { HeroSection } from "@repo/ui"

const meta: Meta<typeof HeroSection> = {
	title: "Sections/HeroSection",
	component: HeroSection,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		alignment: {
			control: "select",
			options: ["left", "center", "right"],
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		backgroundStyle: {
			control: "select",
			options: ["solid", "gradient", "none"],
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		title: "Welcome to Our Platform",
		subtitle: "Build amazing products with our powerful tools and services",
		alignment: "center",
		size: "md",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "Get Started",
				href: "/get-started",
				variant: "primary",
			},
			{
				label: "Learn More",
				href: "/docs",
				variant: "secondary",
			},
		],
	},
}

export const LeftAligned: Story = {
	args: {
		title: "Build Your Next Project",
		subtitle: "Everything you need to create stunning web applications",
		alignment: "left",
		size: "md",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "Start Building",
				href: "/start",
				variant: "primary",
			},
		],
	},
}

export const RightAligned: Story = {
	args: {
		title: "Transform Your Ideas",
		subtitle: "Powerful tools for modern developers",
		alignment: "right",
		size: "md",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "View Demos",
				href: "/demos",
				variant: "primary",
			},
		],
	},
}

export const LargeSize: Story = {
	args: {
		title: "Innovation Starts Here",
		subtitle: "Join thousands of developers building the future",
		alignment: "center",
		size: "lg",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "Join Now",
				href: "/join",
				variant: "primary",
			},
			{
				label: "View Pricing",
				href: "/pricing",
				variant: "secondary",
			},
		],
	},
}

export const SmallSize: Story = {
	args: {
		title: "Quick Start",
		subtitle: "Get up and running in minutes",
		alignment: "center",
		size: "sm",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "Quick Start",
				href: "/quick-start",
				variant: "primary",
			},
		],
	},
}

export const SolidBackground: Story = {
	args: {
		title: "Clean and Simple",
		subtitle: "Sometimes less is more",
		alignment: "center",
		size: "md",
		backgroundStyle: "solid",
		buttons: [
			{
				label: "Explore",
				href: "/explore",
				variant: "primary",
			},
		],
	},
}

export const NoBackground: Story = {
	args: {
		title: "Transparent Hero",
		subtitle: "Perfect for overlaying on images",
		alignment: "center",
		size: "md",
		backgroundStyle: "none",
		buttons: [
			{
				label: "Learn More",
				href: "/learn",
				variant: "primary",
			},
		],
	},
}

export const WithExternalLink: Story = {
	args: {
		title: "Connect With Us",
		subtitle: "Follow our journey on social media",
		alignment: "center",
		size: "md",
		backgroundStyle: "gradient",
		buttons: [
			{
				label: "GitHub",
				href: "https://github.com",
				variant: "primary",
				external: true,
			},
			{
				label: "Twitter",
				href: "https://twitter.com",
				variant: "secondary",
				external: true,
			},
		],
	},
}

export const NoButtons: Story = {
	args: {
		title: "Simple Announcement",
		subtitle: "Sometimes you just need text",
		alignment: "center",
		size: "md",
		backgroundStyle: "gradient",
		buttons: [],
	},
}
