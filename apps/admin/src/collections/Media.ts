import type {CollectionConfig} from "payload";
import path from "path";
import {fileURLToPath} from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
	slug: "media",
	access: {
		read: () => true,
	},
	typescript: {
		interface: "MediaInterface",
	},
	fields: [
		// TODO: Should use upload field
		{
			name: "src",
			type: "text",
			required: true,
		},
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
};
