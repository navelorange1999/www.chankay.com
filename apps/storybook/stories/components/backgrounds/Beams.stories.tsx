import type { Meta, StoryObj } from "@storybook/react-vite"
import { BackgroundBeams } from "@repo/ui"
import type { BackgroundBeamsProps } from "@repo/ui"

const meta: Meta<typeof BackgroundBeams> = {
	title: "Components/Backgrounds/Beams",
	component: BackgroundBeams,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		className: {
			control: "text",
			description: "Additional CSS classes to apply to the background",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-screen w-full overflow-hidden bg-background">
			<BackgroundBeams {...args} />
		</div>
	),
}

export const WithContent: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-screen w-full overflow-hidden bg-background flex items-center justify-center">
			<BackgroundBeams {...args} />
			<div className="relative z-10 text-center px-4">
				<h1 className="text-4xl md:text-6xl font-bold  mb-4">Background Beams</h1>
				<p className="text-lg md:text-x max-w-2xl">
					A beautiful animated background effect with gradient beams
				</p>
			</div>
		</div>
	),
}

export const SmallContainer: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-96 w-full overflow-hidden bg-background">
			<BackgroundBeams {...args} />
		</div>
	),
}

export const MediumContainer: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-[600px] w-full overflow-hidden bg-background">
			<BackgroundBeams {...args} />
		</div>
	),
}

export const LargeContainer: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-[1200px] w-full overflow-hidden bg-background">
			<BackgroundBeams {...args} />
		</div>
	),
}

export const InCard: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="p-8 bg-gray-100 dark:bg-gray-900">
			<div className="relative h-96 w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl bg-background">
				<BackgroundBeams {...args} />
				<div className="relative z-10 flex h-full items-center justify-center">
					<div className="text-center px-4">
						<h3 className="text-2xl font-bold  mb-2">Card with Beams</h3>
						<p className="text-x">Background beams inside a card container</p>
					</div>
				</div>
			</div>
		</div>
	),
}

export const WithGradientOverlay: Story = {
	render: (args: BackgroundBeamsProps) => (
		<div className="relative h-screen w-full overflow-hidden bg-background">
			<BackgroundBeams {...args} />
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-5" />
			<div className="relative z-10 flex h-full items-center justify-center">
				<div className="text-center px-4">
					<h2 className="text-4xl md:text-6xl font-bold mb-4">With Gradient Overlay</h2>
					<p className="text-lg text-x">Combining beams with gradient overlays for depth</p>
				</div>
			</div>
		</div>
	),
}
