import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@repo/ui"
import { Download, Heart, Star } from "lucide-react"

const meta: Meta<typeof Button> = {
	title: "Components/Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "icon"],
		},
		disabled: {
			control: "boolean",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		children: "Button",
		variant: "default",
	},
}

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button variant="default">Default</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="link">Link</Button>
		</div>
	),
}

export const AllSizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-4">
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
			<Button size="icon">
				<Star className="h-4 w-4" />
			</Button>
		</div>
	),
}

export const WithIcons: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button>
				<Download className="h-4 w-4" />
				Download
			</Button>
			<Button variant="outline">
				<Heart className="h-4 w-4" />
				Like
			</Button>
			<Button variant="secondary">
				<Star className="h-4 w-4" />
				Star
			</Button>
		</div>
	),
}

export const Disabled: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button disabled>Disabled Default</Button>
			<Button variant="outline" disabled>
				Disabled Outline
			</Button>
			<Button variant="secondary" disabled>
				Disabled Secondary
			</Button>
		</div>
	),
}

export const Destructive: Story = {
	args: {
		children: "Delete Account",
		variant: "destructive",
	},
}

export const Outline: Story = {
	args: {
		children: "Outline Button",
		variant: "outline",
	},
}

export const Secondary: Story = {
	args: {
		children: "Secondary Button",
		variant: "secondary",
	},
}

export const Ghost: Story = {
	args: {
		children: "Ghost Button",
		variant: "ghost",
	},
}

export const Link: Story = {
	args: {
		children: "Link Button",
		variant: "link",
	},
}

export const Small: Story = {
	args: {
		children: "Small Button",
		size: "sm",
	},
}

export const Large: Story = {
	args: {
		children: "Large Button",
		size: "lg",
	},
}

export const IconOnly: Story = {
	args: {
		size: "icon",
		children: <Star className="h-4 w-4" />,
	},
}
