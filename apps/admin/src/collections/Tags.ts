import type { CollectionConfig } from "payload"
import { authenticated } from "../access/authenticated"
import { createBasicTranslationHook } from "../hooks/createTranslationHook"
import { colorPickerField } from "../fields/colorPickerField"
import { publishedOrAuthenticated } from "../access/publishedOrAuthenticated"
import {
	capturePublicSnapshot,
	capturePublicDeleteSnapshot,
	createRevalidationDeleteHook,
	createRevalidationHook,
} from "../hooks/revalidateWww"

export const Tags: CollectionConfig = {
	slug: "tags",
	access: {
		read: publishedOrAuthenticated,
		readVersions: authenticated,
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: ["name", "slug", "_status"],
		useAsTitle: "name",
	},
	versions: { drafts: true, maxPerDoc: 10 },
	fields: [
		{ name: "posts", type: "join", collection: "posts", on: "tags", defaultLimit: 10, maxDepth: 1 },
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
					({ data, originalDoc }) => {
						if (data?.slug === undefined && originalDoc?.slug) {
							return originalDoc.slug
						}

						if (data?.name && data.slug === undefined) {
							return data.name
								.toLowerCase()
								.replace(/[^\w\s-]/g, "")
								.replace(/\s+/g, "-")
								.trim()
						}
						return data?.slug
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
		colorPickerField({
			name: "color",
			label: "Tag Color",
			defaultValue: "#10B981",
			admin: {
				description: "Color for UI theming and visual distinction",
			},
		}),
		{
			name: "priority",
			type: "number",
			defaultValue: 0,
			admin: {
				description: "Higher priority tags appear first (0-100)",
			},
		},
		{
			name: "featured",
			type: "checkbox",
			admin: {
				description: "Show this tag prominently in tag clouds and filters",
			},
		},
	],
	timestamps: true,
	hooks: {
		beforeDelete: [capturePublicDeleteSnapshot("tags")],
		beforeChange: [capturePublicSnapshot("tags"), createBasicTranslationHook()],
		afterChange: [createRevalidationHook("tags")],
		afterDelete: [createRevalidationDeleteHook("tags")],
	},
}
