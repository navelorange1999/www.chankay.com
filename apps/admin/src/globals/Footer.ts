import {Media} from "@/collections";
import type {GlobalConfig} from "payload";

export const Footer: GlobalConfig = {
	slug: "footer",
	typescript: {
		interface: "FooterInterface",
	},
	access: {
		read: () => true,
	},

	fields: [
		{
			name: "props",
			type: "group",
			label: "Props",
			interfaceName: "FooterProps",
			fields: [
				{
					name: "logo",
					label: "Logo",
					// TODO: Use upload field and relationTo
					type: "group",
					fields: Media.fields,
				},
				{
					name: "title",
					type: "text",
					label: "Title",
					defaultValue: "Chan Kay's site",
					required: false,
				},
				{
					name: "copyright",
					type: "text",
					label: "Copyright",
					required: false,
				},
				{
					name: "socials",
					type: "array",
					label: "Social Links",
					required: false,
					fields: [
						{
							name: "name",
							type: "text",
							label: "Social Platform Name",
							required: true,
						},
						{
							name: "href",
							type: "text",
							label: "URL",
							required: true,
						},
						{
							name: "icon",
							label: "Icon",
							// TODO: Use upload field and relationTo
							type: "group",
							fields: Media.fields,
							required: true,
						},
					],
				},
				{
					name: "className",
					type: "text",
					required: false,
				},
			],
		},
	],
};
