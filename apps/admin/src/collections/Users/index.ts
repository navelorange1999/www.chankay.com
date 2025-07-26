import type {CollectionConfig} from "payload";
import {authenticated} from "../../access/authenticated";

export const Users: CollectionConfig = {
	slug: "users",

	access: {
		admin: authenticated,
	},
	admin: {
		defaultColumns: ["name", "email"],
		useAsTitle: "name",
	},
	auth: {
		loginWithUsername: true,
	},
	fields: [
		{
			name: "name",
			type: "text",
		},
	],
	timestamps: true,
};
