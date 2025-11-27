import type { Meta, StoryObj } from "@storybook/react-vite"
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	CardAction,
} from "@repo/ui"
import { Button } from "@repo/ui"
import { Settings, MoreVertical } from "lucide-react"

const meta: Meta<typeof Card> = {
	title: "Components/Card",
	component: Card,
	tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card description goes here</CardDescription>
			</CardHeader>
			<CardContent>
				<p>This is the main content of the card. You can put any content here.</p>
			</CardContent>
		</Card>
	),
}

export const WithFooter: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Card with Footer</CardTitle>
				<CardDescription>This card includes a footer section</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Main content area with important information.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline">Cancel</Button>
				<Button>Save</Button>
			</CardFooter>
		</Card>
	),
}

export const WithAction: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Card with Action</CardTitle>
				<CardDescription>This card has an action button in the header</CardDescription>
				<CardAction>
					<Button variant="ghost" size="icon">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<p>Content with an action button in the top right corner.</p>
			</CardContent>
		</Card>
	),
}

export const FullExample: Story = {
	render: () => (
		<Card>
			<CardHeader>
				<CardTitle>Settings</CardTitle>
				<CardDescription>Manage your account settings and preferences</CardDescription>
				<CardAction>
					<Button variant="ghost" size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<h4 className="font-medium mb-1">Email Notifications</h4>
						<p className="text-sm text-muted-foreground">
							Receive emails about your account activity
						</p>
					</div>
					<div>
						<h4 className="font-medium mb-1">Security</h4>
						<p className="text-sm text-muted-foreground">
							Two-factor authentication and security settings
						</p>
					</div>
				</div>
			</CardContent>
			<CardFooter className="border-t">
				<Button variant="outline" className="mr-2">
					Cancel
				</Button>
				<Button>Save Changes</Button>
			</CardFooter>
		</Card>
	),
}

export const SimpleContent: Story = {
	render: () => (
		<Card>
			<CardContent className="pt-6">
				<p>Simple card with just content, no header or footer.</p>
			</CardContent>
		</Card>
	),
}

export const MultipleCards: Story = {
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Card 1</CardTitle>
					<CardDescription>First card description</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the first card</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Card 2</CardTitle>
					<CardDescription>Second card description</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the second card</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Card 3</CardTitle>
					<CardDescription>Third card description</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the third card</p>
				</CardContent>
			</Card>
		</div>
	),
}
