import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";
import {createBasicTranslationHook} from "../hooks/createTranslationHook";

export const Categories: CollectionConfig = {
	slug: "categories",
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
			label: "Category Name",
			required: true,
			unique: true,
			index: true,
			localized: true,
			admin: {
				placeholder: "e.g., Technology, Design, Personal",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				description: "URL-friendly version of the category name",
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
				placeholder: "Brief description of this category",
			},
		},
		{
			name: "color",
			type: "text",
			admin: {
				placeholder: "#3B82F6",
				description: "Hex color code for UI theming",
			},
		},
		{
			name: "icon",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Optional icon for the category",
			},
		},
		{
			name: "postCount",
			type: "number",
			defaultValue: 0,
			admin: {
				readOnly: true,
				description: "Number of posts in this category",
			},
		},
		{
			name: "featured",
			type: "checkbox",
			admin: {
				description: "Show this category prominently",
			},
		},
	],
	timestamps: true,
	hooks: {
		beforeChange: [createBasicTranslationHook()],
	},
};
