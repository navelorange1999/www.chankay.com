import type { Meta, StoryObj } from "@storybook/react-vite"
import { Flex } from "@repo/ui"

const meta: Meta<typeof Flex> = {
	title: "Components/Structure/Flex",
	component: Flex,
	tags: ["autodocs"],
	argTypes: {
		as: {
			control: "select",
			options: ["div", "section", "main", "article", "header", "footer", "nav", "aside"],
		},
		direction: {
			control: "select",
			options: ["row", "rowReverse", "col", "colReverse"],
		},
		wrap: {
			control: "select",
			options: ["nowrap", "wrap", "wrapReverse"],
		},
		align: {
			control: "select",
			options: ["start", "center", "end", "stretch", "baseline"],
		},
		justify: {
			control: "select",
			options: ["start", "center", "end", "between", "around", "evenly"],
		},
		gap: {
			control: "select",
			options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"],
		},
		inline: {
			control: "boolean",
		},
	},
	args: {
		direction: "row",
		wrap: "nowrap",
		align: "center",
		justify: "start",
		gap: "md",
		children: "Flex content",
	},
}

export default meta

type Story = StoryObj<typeof meta>

function Item({ label }: { label: string }) {
	return <div className="rounded-md border bg-card px-3 py-2 text-sm">{label}</div>
}

export const Playground: Story = {
	render: (args) => (
		<Flex {...args}>
			<Item label="Item 1" />
			<Item label="Item 2" />
			<Item label="Item 3" />
		</Flex>
	),
}

export const WrappingItems: Story = {
	render: () => (
		<Flex wrap="wrap" gap="sm" className="max-w-sm">
			{Array.from({ length: 8 }).map((_, index) => (
				<Item key={index} label={`Tag ${index + 1}`} />
			))}
		</Flex>
	),
}

export const ColumnLayout: Story = {
	render: () => (
		<Flex direction="col" gap="sm" className="max-w-xs">
			<Item label="Header" />
			<Item label="Body" />
			<Item label="Footer" />
		</Flex>
	),
}
