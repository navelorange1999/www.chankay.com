import type { Meta, StoryObj } from "@storybook/react-vite"
import { Grid } from "@repo/ui"

const meta: Meta<typeof Grid> = {
	title: "Components/Structure/Grid",
	component: Grid,
	tags: ["autodocs"],
	argTypes: {
		as: {
			control: "select",
			options: ["div", "section", "main", "article", "header", "footer", "nav", "aside"],
		},
		columns: {
			control: "select",
			options: [1, 2, 3, 4, 5, 6],
		},
		columnsSm: {
			control: "select",
			options: [undefined, 1, 2, 3, 4, 5, 6],
		},
		columnsMd: {
			control: "select",
			options: [undefined, 1, 2, 3, 4, 5, 6],
		},
		columnsLg: {
			control: "select",
			options: [undefined, 1, 2, 3, 4, 5, 6],
		},
		gap: {
			control: "select",
			options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"],
		},
		alignItems: {
			control: "select",
			options: ["start", "center", "end", "stretch", "baseline"],
		},
		justifyItems: {
			control: "select",
			options: ["start", "center", "end", "stretch"],
		},
	},
	args: {
		columns: 3,
		gap: "md",
		alignItems: "stretch",
		justifyItems: "stretch",
	},
}

export default meta

type Story = StoryObj<typeof meta>

function Cell({ label }: { label: string }) {
	return <div className="rounded-md border bg-card p-4 text-sm">{label}</div>
}

export const Playground: Story = {
	render: (args) => (
		<Grid {...args}>
			<Cell label="Cell 1" />
			<Cell label="Cell 2" />
			<Cell label="Cell 3" />
			<Cell label="Cell 4" />
			<Cell label="Cell 5" />
			<Cell label="Cell 6" />
		</Grid>
	),
}

export const ResponsiveColumns: Story = {
	render: () => (
		<Grid columns={1} columnsSm={2} columnsMd={3} columnsLg={4} gap="sm">
			{Array.from({ length: 8 }).map((_, index) => (
				<Cell key={index} label={`Card ${index + 1}`} />
			))}
		</Grid>
	),
}

export const AlignedItems: Story = {
	render: () => (
		<Grid columns={3} gap="md" alignItems="center" justifyItems="center" className="min-h-48">
			<Cell label="Top" />
			<Cell label="Middle" />
			<Cell label="Bottom" />
		</Grid>
	),
}
