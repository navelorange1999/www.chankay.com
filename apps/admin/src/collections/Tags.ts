import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";

export const Tags: CollectionConfig = {
	slug: "tags",
	access: {
		read: () => true, // Public read access
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: ["name", "slug", "postCount"],
		useAsTitle: "name",
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				placeholder: "e.g., react, javascript, tutorial",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				description: "URL-friendly version of the tag name",
			},
			hooks: {
				beforeValidate: [
					({data}) => {
						if (data?.name && !data?.slug) {
							return data.name
								.toLowerCase()
								.replace(/[^\w\s-]/g, "")
								.replace(/\s+/g, "-")
								.trim();
						}
						return data?.slug;
					},
				],
			},
		},
		{
			name: "description",
			type: "textarea",
			admin: {
				placeholder: "Brief description of this tag",
			},
		},
		{
			name: "color",
			type: "text",
			admin: {
				placeholder: "#10B981",
				description: "Hex color code for UI theming",
			},
		},
		{
			name: "postCount",
			type: "number",
			defaultValue: 0,
			admin: {
				readOnly: true,
				description: "Number of posts with this tag",
			},
		},
	],
	timestamps: true,
};
