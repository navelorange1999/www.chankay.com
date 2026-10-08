import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Treemap, type TreemapNode } from "@repo/ui/components/Treemap"

const sample: TreemapNode = {
	id: "portfolio",
	label: "Portfolio allocation",
	children: [
		{
			id: "equities",
			label: "Equities",
			children: [
				{ id: "domestic", label: "Domestic", value: 36 },
				{ id: "international", label: "International", value: 24 },
				{ id: "emerging", label: "Emerging markets", value: 10 },
			],
		},
		{
			id: "fixed-income",
			label: "Fixed income",
			children: [
				{ id: "bonds", label: "Bonds", value: 20 },
				{ id: "cash", label: "Cash", value: 10 },
			],
		},
	],
}

const meta: Meta<typeof Treemap> = {
	title: "Components/Charts/Treemap",
	component: Treemap,
	tags: ["autodocs"],
	args: { data: sample, ariaLabel: "Portfolio allocation" },
}

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

function InteractiveExample({ data = sample }: { data?: TreemapNode }) {
	const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
	const [selected, setSelected] = useState<string | null>(null)
	return (
		<div className="max-w-4xl space-y-3">
			<button type="button" onClick={() => setFocusedNodeId(null)}>
				All assets
			</button>
			<Treemap
				data={data}
				ariaLabel={data.label}
				focusedNodeId={focusedNodeId}
				onFocusChange={setFocusedNodeId}
				onLeafActivate={setSelected}
			/>
			<p>Selected: {selected ?? "none"}</p>
		</div>
	)
}

export const Interactive: Story = { render: () => <InteractiveExample /> }

const longLabels: TreemapNode = {
	id: "research",
	label: "Research equipment allocation",
	children: [
		{
			id: "instruments",
			label: "Research and experimental instrumentation",
			children: [
				{ id: "imaging", label: "High-resolution imaging and measurement systems", value: 80 },
				{ id: "calibration", label: "精密测量与长期校准设备", value: 35 },
				...Array.from({ length: 12 }, (_, index) => ({
					id: `accessory-${index}`,
					label: `Specialized laboratory accessory ${index + 1}`,
					value: (index % 3) + 1,
				})),
			],
		},
		{
			id: "infrastructure",
			label: "共享基础设施与长期维护服务",
			children: [
				{ id: "storage", label: "Shared storage and environmental controls", value: 25 },
				{ id: "maintenance", label: "Preventive maintenance", value: 8 },
				{ id: "replacement", label: "Replacement parts", value: 1 },
			],
		},
	],
}

export const LongLabelsAndSmallTopics: Story = {
	args: { data: longLabels, ariaLabel: longLabels.label },
	render: () => <InteractiveExample data={longLabels} />,
}
