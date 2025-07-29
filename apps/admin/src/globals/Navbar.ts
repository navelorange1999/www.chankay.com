import type {GlobalConfig} from "payload";

export const Navbar: GlobalConfig = {
	slug: "navbar",
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "items",
			type: "array",
			fields: [],
			maxRows: 6,
			admin: {
				initCollapsed: true,
				components: {},
			},
		},
	],
	hooks: {
		afterChange: [],
	},
};
