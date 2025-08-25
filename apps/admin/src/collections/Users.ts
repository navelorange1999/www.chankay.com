import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";

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
		useAPIKey: false,
		loginWithUsername: false,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "email",
			type: "email",
			unique: true,
			index: true,
			required: true,
		},
		{
			name: "accounts",
			type: "array",
			admin: {
				description: "Connected OAuth accounts",
			},
			fields: [
				{
					name: "provider",
					type: "select",
					options: [
						{label: "GitHub", value: "github"},
						{label: "Google", value: "google"},
						{label: "Microsoft", value: "microsoft"},
					],
					required: true,
				},
				{
					name: "providerAccountId",
					type: "text",
					required: true,
					admin: {
						description:
							"Provider's unique user ID (e.g., GitHub ID: 583231), you can find this in https://api.github.com/users/{{your-github-username}}",
					},
				},
				{
					name: "providerUsername",
					type: "text",
					admin: {
						description:
							"Provider username (may change, e.g., GitHub @username)",
					},
				},
				{
					name: "providerEmail",
					type: "email",
					admin: {
						description:
							"Email associated with this provider account",
					},
				},
				{
					name: "connectedAt",
					type: "date",
					defaultValue: () => new Date(),
				},
			],
		},
		{
			name: "role",
			type: "select",
			options: [
				{label: "Admin", value: "admin"},
				{label: "Editor", value: "editor"},
			],
			defaultValue: "admin",
		},
	],
	timestamps: true,
};
