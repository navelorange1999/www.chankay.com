import type { Meta, StoryObj } from "@storybook/react-vite"
import { FeaturesSection } from "@repo/ui"

const meta: Meta<typeof FeaturesSection> = {
	title: "Sections/FeaturesSection",
	component: FeaturesSection,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		layout: {
			control: "select",
			options: ["grid", "list"],
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		title: "Why Choose Us",
		subtitle: "Everything you need to build amazing products",
		layout: "grid",
		items: [
			{
				icon: "Zap",
				title: "Lightning Fast",
				description:
					"Optimized for performance with blazing fast load times and smooth interactions.",
			},
			{
				icon: "Shield",
				title: "Secure by Default",
				description: "Built with security best practices to keep your data safe and protected.",
			},
			{
				icon: "Smartphone",
				title: "Mobile First",
				description: "Responsive design that looks great on all devices, from mobile to desktop.",
			},
			{
				icon: "Code",
				title: "Developer Friendly",
				description: "Clean APIs and comprehensive documentation make integration a breeze.",
			},
			{
				icon: "Globe",
				title: "Global Scale",
				description: "Deploy worldwide with our distributed infrastructure and CDN network.",
			},
			{
				icon: "Clock",
				title: "24/7 Support",
				description: "Round-the-clock support to help you succeed at every step of your journey.",
			},
		],
	},
}

export const ListLayout: Story = {
	args: {
		title: "Core Features",
		subtitle: "Powerful tools to help you succeed",
		layout: "list",
		items: [
			{
				icon: "Database",
				title: "Database Management",
				description:
					"Powerful database tools with automatic backups, migrations, and real-time synchronization.",
			},
			{
				icon: "Users",
				title: "User Management",
				description:
					"Complete authentication system with role-based access control and social login.",
			},
			{
				icon: "BarChart",
				title: "Analytics Dashboard",
				description: "Comprehensive analytics with real-time insights and customizable reports.",
			},
			{
				icon: "Lock",
				title: "Advanced Security",
				description: "Enterprise-grade security with encryption, audit logs, and compliance tools.",
			},
		],
	},
}

export const ThreeColumns: Story = {
	args: {
		title: "Product Features",
		subtitle: "Everything you need in one platform",
		layout: "grid",
		items: [
			{
				icon: "Rocket",
				title: "Quick Setup",
				description: "Get started in minutes with our streamlined onboarding process.",
			},
			{
				icon: "Settings",
				title: "Customizable",
				description: "Tailor every aspect to match your brand and requirements.",
			},
			{
				icon: "TrendingUp",
				title: "Scalable",
				description: "Grow from startup to enterprise without changing platforms.",
			},
		],
	},
}

export const FourColumns: Story = {
	args: {
		title: "Platform Benefits",
		subtitle: "Built for modern teams",
		layout: "grid",
		items: [
			{
				icon: "Heart",
				title: "User Experience",
				description: "Intuitive interface designed with your users in mind.",
			},
			{
				icon: "Cpu",
				title: "Performance",
				description: "Optimized for speed and efficiency across all devices.",
			},
			{
				icon: "Package",
				title: "All-in-One",
				description: "Everything you need in a single, unified platform.",
			},
			{
				icon: "Puzzle",
				title: "Integrations",
				description: "Connect with your favorite tools and services seamlessly.",
			},
		],
	},
}

export const NoIcons: Story = {
	args: {
		title: "Simple Features",
		subtitle: "Focus on what matters",
		layout: "grid",
		items: [
			{
				title: "Easy to Use",
				description: "Intuitive interface that anyone can master in minutes.",
			},
			{
				title: "Reliable",
				description: "99.99% uptime guarantee with automated monitoring.",
			},
			{
				title: "Affordable",
				description: "Transparent pricing with no hidden fees or surprises.",
			},
		],
	},
}

export const WithIcons: Story = {
	args: {
		title: "Features",
		subtitle: "Focus on what matters",
		layout: "grid",
		items: [
			{
				icon: "AArrowDown",
				title: "Easy to Use",
				description: "Intuitive interface that anyone can master in minutes.",
			},
			{
				icon: "ZoomIn",
				title: "Reliable",
				description: "99.99% uptime guarantee with automated monitoring.",
			},
			{
				icon: "AirplayIcon",
				title: "Affordable",
				description: "Transparent pricing with no hidden fees or surprises.",
			},
		],
	},
}
