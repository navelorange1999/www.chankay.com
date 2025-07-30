import type {GlobalConfig} from "payload";

export const Navbar: GlobalConfig = {
	slug: "navbar",
	access: {
		read: () => true,
	},

	fields: [
		{
			name: "props",

			interfaceName: "NavbarProps",
			label: "Props",
			type: "group",
			fields: [
				{
					name: "logo",
					label: "Logo Url",
					type: "text",
				},
				{
					name: "title",
					type: "text",
				},
				{
					name: "items",
					type: "array",
					fields: [
						{
							name: "label",
							type: "text",
							required: true,
						},
						{
							name: "href",
							type: "text",
							required: true,
						},
						{
							name: "external",
							type: "checkbox",
						},
					],
					maxRows: 6,
					admin: {
						initCollapsed: true,
						components: {},
					},
				},
				{
					name: "className",
					type: "text",
				},
			],
		},
	],
	hooks: {
		afterChange: [],
	},
};
