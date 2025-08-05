import type {CollectionConfig} from "payload";

export const Media: CollectionConfig = {
	slug: "media",
	access: {
		read: () => true,
	},

	typescript: {
		interface: "MediaInterface",
	},
	fields: [
		{
			name: "alt",
			type: "text",
			required: true,
		},
		{
			name: "width",
			type: "number",
			required: true,
		},
		{name: "height", type: "number", required: true},
	],
	upload: {
		// because we are using vercel blob storage, we need to disable local storage
		disableLocalStorage: true,

		adminThumbnail: ({doc}) =>
			`${process.env.VERCEL_BLOB_PUBLIC_BASE_URL}/${doc.prefix}/${doc.filename}`,
	},
};
