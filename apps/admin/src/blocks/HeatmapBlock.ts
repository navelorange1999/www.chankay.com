import type { BlockDefinition } from "./types"

export const HeatmapBlock: BlockDefinition = {
	slug: "heatmap",
	labels: {
		singular: "Heatmap",
		plural: "Heatmaps",
	},
	fields: [
		{
			name: "source",
			type: "radio",
			label: "Source",
			defaultValue: "github",
			options: [
				{ label: "GitHub", value: "github" },
				{ label: "Custom JSON", value: "custom" },
			],
		},
		{
			name: "github",
			type: "group",
			label: "GitHub Settings",
			admin: {
				condition: (_, siblingData) => siblingData?.source === "github",
			},
			fields: [
				{
					name: "username",
					type: "text",
					label: "Username",
					required: true,
					admin: { placeholder: "your-github-username" },
					validate: (val: unknown) => {
						if (typeof val !== "string") return "Please enter a valid GitHub username"
						const username = val.trim()
						if (!username) return "Please enter a GitHub username"
						if (!/^[a-zA-Z0-9-]{1,39}$/.test(username))
							return "Please enter a valid GitHub username"
						return true
					},
				},
				{
					name: "range",
					type: "select",
					label: "Range",
					defaultValue: "last_365",
					options: [
						{ label: "Last 30 days", value: "last_30" },
						{ label: "Last 90 days", value: "last_90" },
						{ label: "Last 180 days", value: "last_180" },
						{ label: "Last 365 days", value: "last_365" },
						{ label: "Year to date", value: "ytd" },
					],
				},
			],
		},
		{
			name: "custom",
			type: "group",
			label: "Custom Data",
			admin: {
				condition: (_, siblingData) => siblingData?.source === "custom",
			},
			fields: [
				{
					name: "customData",
					type: "json",
					label: "Custom Data (JSON)",
					admin: {
						description: 'Expected shape: { "days": [{ "date": "YYYY-MM-DD", "count": 3 }] }',
					},
				},
			],
		},
		{
			name: "display",
			type: "group",
			label: "Display",
			fields: [
				{
					name: "animateFill",
					type: "number",
					label: "Animate Fill (seconds)",
					min: 0.5,
					max: 20,
					admin: {
						description:
							"Optional. When set, the heatmap fills in chronological order over the provided seconds.",
						placeholder: "5",
					},
				},
				{
					name: "size",
					type: "radio",
					label: "Size",
					defaultValue: "md",
					options: [
						{ label: "Small", value: "sm" },
						{ label: "Medium", value: "md" },
						{ label: "Large", value: "lg" },
					],
				},
				{
					name: "showLegend",
					type: "checkbox",
					label: "Show Legend",
					defaultValue: true,
				},
				{
					name: "showTotal",
					type: "checkbox",
					label: "Show Total",
					defaultValue: false,
				},
			],
		},
	],
}
