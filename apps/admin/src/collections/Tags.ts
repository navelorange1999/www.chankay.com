import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";
import {createBasicTranslationHook} from "../hooks/createTranslationHook";

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
			label: "Tag Name",
			required: true,
			unique: true,
			index: true,
			localized: true,
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
			label: "Description",
			localized: true,
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
	hooks: {
		beforeChange: [createBasicTranslationHook()],
	},
};
