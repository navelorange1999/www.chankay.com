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

export const SignupCTA: Story = {
	args: {
		title: "Start Your Journey Today",
		description: "No credit card required. Get started in minutes with our free tier.",
		buttonLabel: "Create Free Account",
		buttonHref: "/signup",
		style: "primary",
	},
}

export const ContactCTA: Story = {
	args: {
		title: "Have Questions? We're Here to Help",
		description: "Our team is ready to answer your questions and help you get started.",
		buttonLabel: "Contact Sales",
		buttonHref: "/contact",
		style: "accent",
	},
}

export const UpgradeCTA: Story = {
	args: {
		title: "Unlock Premium Features",
		description:
			"Upgrade to Pro and get access to advanced analytics, priority support, and unlimited projects.",
		buttonLabel: "Upgrade Now",
		buttonHref: "/pricing",
		style: "accent",
	},
}

export const EventCTA: Story = {
	args: {
		title: "Join Us at Our Annual Conference",
		description: "Connect with industry leaders and learn about the latest trends in technology.",
		buttonLabel: "Register Now",
		buttonHref: "/events",
		style: "primary",
	},
}

export const NewsletterCTA: Story = {
	args: {
		title: "Stay in the Loop",
		description: "Get weekly insights, tips, and updates delivered straight to your inbox.",
		buttonLabel: "Subscribe to Newsletter",
		buttonHref: "/newsletter",
		style: "accent",
	},
}

export const DownloadCTA: Story = {
	args: {
		title: "Try Our Desktop App",
		description: "Get the full experience with our native desktop application for Mac and Windows.",
		buttonLabel: "Download Now",
		buttonHref: "/download",
		style: "primary",
	},
}

export const DocumentationCTA: Story = {
	args: {
		title: "Need Help Getting Started?",
		description: "Check out our comprehensive documentation and tutorials.",
		buttonLabel: "View Documentation",
		buttonHref: "/docs",
		style: "primary",
	},
}

export const PartnershipCTA: Story = {
	args: {
		title: "Become a Partner",
		description:
			"Join our partner program and help your clients succeed while growing your business.",
		buttonLabel: "Learn About Partnerships",
		buttonHref: "/partners",
		style: "accent",
	},
}
