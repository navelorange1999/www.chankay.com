import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "@repo/ui"
import { Label } from "@repo/ui"

const meta: Meta<typeof Input> = {
	title: "Components/Input",
	component: Input,
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "select",
			options: ["text", "email", "password", "number", "tel", "url", "search"],
		},
		disabled: {
			control: "boolean",
		},
		placeholder: {
			control: "text",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		placeholder: "Enter text...",
		type: "text",
	},
}

export const WithLabel: Story = {
	render: () => (
		<div className="space-y-2 w-full max-w-sm">
			<Label htmlFor="email">Email</Label>
			<Input id="email" type="email" placeholder="you@example.com" />
		</div>
	),
}

export const AllTypes: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-sm">
			<div className="space-y-2">
				<Label htmlFor="text">Text</Label>
				<Input id="text" type="text" placeholder="Enter text" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input id="email" type="email" placeholder="you@example.com" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input id="password" type="password" placeholder="Enter password" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="number">Number</Label>
				<Input id="number" type="number" placeholder="Enter number" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="tel">Phone</Label>
				<Input id="tel" type="tel" placeholder="+1 (555) 000-0000" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="url">URL</Label>
				<Input id="url" type="url" placeholder="https://example.com" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="search">Search</Label>
				<Input id="search" type="search" placeholder="Search..." />
			</div>
		</div>
	),
}

export const Disabled: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-sm">
			<Input placeholder="Disabled input" disabled />
			<Input type="email" placeholder="Disabled email" disabled value="user@example.com" />
		</div>
	),
}

export const WithValue: Story = {
	args: {
		type: "text",
		value: "Pre-filled value",
	},
}

export const ErrorState: Story = {
	render: () => (
		<div className="space-y-2 w-full max-w-sm">
			<Label htmlFor="error-email">Email</Label>
			<Input id="error-email" type="email" placeholder="you@example.com" aria-invalid="true" />
			<p className="text-sm text-destructive">Please enter a valid email address</p>
		</div>
	),
}

export const FormExample: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-sm">
			<div className="space-y-2">
				<Label htmlFor="name">Full Name</Label>
				<Input id="name" type="text" placeholder="John Doe" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="form-email">Email Address</Label>
				<Input id="form-email" type="email" placeholder="john@example.com" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="form-password">Password</Label>
				<Input id="form-password" type="password" placeholder="••••••••" />
			</div>
		</div>
	),
}

export const Sizes: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-sm">
			<Input placeholder="Default size" />
			<Input placeholder="Same size (all inputs use same height)" />
		</div>
	),
}
