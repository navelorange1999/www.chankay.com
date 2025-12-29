import type { Meta, StoryObj } from "@storybook/react-vite"
import { SkeletonAvator, SkeletonBasic, SkeletonLines, SkeletonMedia } from "@repo/ui"

const meta: Meta<typeof SkeletonBasic> = {
	title: "Components/Skeletons",
	component: SkeletonBasic,
	tags: ["autodocs"],
	argTypes: {
		className: {
			control: "text",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
	args: {
		className: "h-4 w-64",
	},
	render: (args) => (
		<div className="p-6">
			<SkeletonBasic {...args} />
		</div>
	),
}

export const Avator: Story = {
	render: () => (
		<div className="flex items-center gap-4 p-6">
			<SkeletonAvator size="sm" />
			<SkeletonAvator size="md" />
			<SkeletonAvator size="lg" />
			<SkeletonAvator size="xl" />
			<SkeletonAvator size={72} />
		</div>
	),
}

export const Lines: Story = {
	render: () => (
		<div className="max-w-md p-6">
			<SkeletonLines lines={4} />
		</div>
	),
}

export const Media: Story = {
	render: () => (
		<div className="grid max-w-3xl grid-cols-1 gap-6 p-6 md:grid-cols-2">
			<div className="space-y-3">
				<SkeletonMedia aspect="video" />
				<SkeletonLines lines={2} />
			</div>
			<div className="space-y-3">
				<SkeletonMedia aspect="square" />
				<SkeletonLines lines={3} />
			</div>
		</div>
	),
}
