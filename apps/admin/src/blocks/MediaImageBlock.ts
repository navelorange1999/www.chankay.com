import type { BlockDefinition } from "./types"

export const MediaImageBlock: BlockDefinition = {
	slug: "mediaImage",
	labels: {
		singular: "Image",
		plural: "Images",
	},
	fields: [
		{
			name: "media",
			type: "upload",
			relationTo: "media",
			required: true,
			label: "Image",
		},
	],
}
