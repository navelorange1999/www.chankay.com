import type { BlockDefinition } from "./types"

export const PreviewUrlBlock: BlockDefinition = {
	slug: "previewUrl",
	labels: {
		singular: "Preview URL",
		plural: "Preview URLs",
	},
	fields: [
		{
			name: "previewUrl",
			type: "text",
			required: true,
			label: "Preview URL",
			admin: {
				description: "An HTTPS URL that will be screenshotted and rendered as a preview card.",
				placeholder: "https://example-demo.github.io",
			},
			validate: (value: unknown) => {
				if (typeof value !== "string" || value.trim().length === 0) {
					return "Preview URL is required"
				}

				try {
					const parsed = new URL(value)
					if (parsed.protocol !== "https:") {
						return "Preview URL must use https://"
					}
				} catch {
					return "Preview URL must be a valid URL"
				}

				return true
			},
		},
		{
			name: "waitForMs",
			type: "number",
			label: "Wait Before Capture (ms)",
			defaultValue: 1500,
			min: 0,
			admin: {
				description: "Milliseconds to wait before capturing the preview screenshot.",
			},
		},
		{
			name: "previewStatus",
			type: "select",
			label: "Preview Status",
			defaultValue: "idle",
			admin: {
				readOnly: true,
				description: "Managed automatically after the page is saved.",
			},
			options: [
				{ label: "Idle", value: "idle" },
				{ label: "Generating", value: "generating" },
				{ label: "Ready", value: "ready" },
				{ label: "Failed", value: "failed" },
			],
		},
		{
			name: "previewImage",
			type: "upload",
			label: "Generated Preview Image",
			relationTo: "media",
			admin: {
				readOnly: true,
				description: "Generated automatically from the Preview URL.",
			},
		},
	],
}
