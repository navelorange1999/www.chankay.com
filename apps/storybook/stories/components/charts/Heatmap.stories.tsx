import type { Meta, StoryObj } from "@storybook/react-vite"
import { Heatmap } from "@repo/ui"
import type { HeatmapDay } from "@repo/ui"

const meta: Meta<typeof Heatmap> = {
	title: "Components/Charts/Heatmap",
	component: Heatmap,
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		cellSize: {
			control: "number",
		},
		gap: {
			control: "number",
		},
		showLegend: {
			control: "boolean",
		},
		showTotal: {
			control: "boolean",
		},
		animateFill: {
			control: "number",
		},
	},
}

export default meta

type Story = StoryObj<typeof meta>

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

// Helper function to generate sample data
function generateSampleData(days: number, maxCount: number = 20): HeatmapDay[] {
	const data: HeatmapDay[] = []
	const today = new Date()

	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)
		const dateStr = formatDate(date)
		const count = Math.floor(Math.random() * maxCount)
		data.push({ date: dateStr, count })
	}

	return data
}

// Generate a year of data
function generateYearData(): HeatmapDay[] {
	return generateSampleData(365, 30)
}

// Generate sparse data (few contributions)
function generateSparseData(): HeatmapDay[] {
	const data: HeatmapDay[] = []
	const today = new Date()

	for (let i = 90; i >= 0; i--) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)
		const dateStr = formatDate(date)
		// Only 10% of days have contributions
		const count = Math.random() < 0.1 ? Math.floor(Math.random() * 5) : 0
		data.push({ date: dateStr, count })
	}

	return data
}

// Generate dense data (many contributions)
function generateDenseData(): HeatmapDay[] {
	const data: HeatmapDay[] = []
	const today = new Date()

	for (let i = 180; i >= 0; i--) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)
		const dateStr = formatDate(date)
		// Most days have contributions
		const count = Math.random() < 0.8 ? Math.floor(Math.random() * 50) : 0
		data.push({ date: dateStr, count })
	}

	return data
}

export const Default: Story = {
	args: {
		days: generateSampleData(90, 20),
		size: "md",
		showLegend: true,
		showTotal: false,
	},
}

export const WithTotal: Story = {
	args: {
		days: generateSampleData(90, 20),
		size: "md",
		showLegend: true,
		showTotal: true,
	},
}

export const WithoutLegend: Story = {
	args: {
		days: generateSampleData(90, 20),
		size: "md",
		showLegend: false,
		showTotal: false,
	},
}

export const AllSizes: Story = {
	render: () => (
		<div className="space-y-8">
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Small</h3>
				<Heatmap days={generateSampleData(90, 20)} size="sm" />
			</div>
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Medium (Default)</h3>
				<Heatmap days={generateSampleData(90, 20)} size="md" />
			</div>
			<div className="space-y-2">
				<h3 className="text-sm font-medium">Large</h3>
				<Heatmap days={generateSampleData(90, 20)} size="lg" />
			</div>
		</div>
	),
}

export const CustomSize: Story = {
	args: {
		days: generateSampleData(90, 20),
		cellSize: 16,
		gap: 6,
		showLegend: true,
		showTotal: false,
	},
}

export const YearView: Story = {
	args: {
		days: generateYearData(),
		size: "md",
		showLegend: true,
		showTotal: true,
	},
}

export const NarrowContainer: Story = {
	render: () => (
		<div className="max-w-sm">
			<Heatmap days={generateYearData()} size="md" showLegend showTotal />
		</div>
	),
}

export const MobilePreview: Story = {
	render: () => (
		<div className="max-w-xs">
			<Heatmap days={generateYearData()} size="md" showLegend showTotal />
		</div>
	),
}

export const SparseData: Story = {
	args: {
		days: generateSparseData(),
		size: "md",
		showLegend: true,
		showTotal: true,
	},
}

export const DenseData: Story = {
	args: {
		days: generateDenseData(),
		size: "md",
		showLegend: true,
		showTotal: true,
	},
}

export const ShortRange: Story = {
	args: {
		days: generateSampleData(30, 15),
		size: "md",
		showLegend: true,
		showTotal: true,
	},
}

export const AllFeatures: Story = {
	args: {
		days: generateSampleData(180, 25),
		size: "lg",
		showLegend: true,
		showTotal: true,
	},
}

export const Minimal: Story = {
	args: {
		days: generateSampleData(60, 10),
		size: "sm",
		showLegend: false,
		showTotal: false,
	},
}
