import type { Meta, StoryObj } from "@storybook/react-vite"

import { Container } from "@repo/ui/components/Container"
import { Heatmap } from "@repo/ui/components/Heatmap"

const meta: Meta<typeof Container> = {
	title: "Components/Layout/Container",
	component: Container,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof meta>

const days = Array.from({ length: 365 }, (_, index) => ({
	date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
	count: index % 5,
}))

export const PageAlignment: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Check at 375, 768, 1280, and 1600px: navigation, nested content, heatmap region, and footer share both edges. Reading content stays narrower on desktop. The page must not overflow horizontally.",
			},
		},
	},
	render: () => (
		<>
			<header className="border-b py-4">
				<Container>
					<div className="border-x">Navigation</div>
				</Container>
			</header>
			<main>
				<Container className="py-8">
					<Container size="full">
						<div className="flex flex-col items-center gap-8">
							<Heatmap days={days} showTotal />
							<Container>
								<Container>
									<div className="border p-6">Content inside three nested containers</div>
								</Container>
							</Container>
						</div>
					</Container>
					<Container size="reading" className="py-8">
						<p className="border-x">Article content uses the shared reading width.</p>
					</Container>
				</Container>
			</main>
			<footer className="border-t py-4">
				<Container>
					<div className="border-x">Footer</div>
				</Container>
			</footer>
		</>
	),
}
