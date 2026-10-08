import type { CollectionConfig } from "payload"
import { authenticated } from "../access/authenticated"
import { createBasicTranslationHook } from "../hooks/createTranslationHook"
import { publishedOrAuthenticated } from "../access/publishedOrAuthenticated"
import {
	capturePublicSnapshot,
	capturePublicDeleteSnapshot,
	createRevalidationDeleteHook,
	createRevalidationHook,
} from "../hooks/revalidateWww"

export const Series: CollectionConfig = {
	slug: "series",
	access: {
		read: publishedOrAuthenticated,
		readVersions: authenticated,
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: ["title", "_status", "progress", "author"],
		useAsTitle: "title",
	},
	versions: { drafts: true, maxPerDoc: 10 },
	fields: [
		{
			name: "posts",
			type: "join",
			collection: "posts",
			on: "series",
			defaultLimit: 10,
			maxDepth: 1,
		},
		{
			name: "title",
			type: "text",
			label: "Series Title",
			required: true,
			index: true,
			localized: true,
			admin: {
				placeholder: "e.g., React Fundamentals, Design Systems Guide",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				description: "URL-friendly version of the series title",
			},
			hooks: {
				beforeValidate: [
					({ data }) => {
						if (data?.title && !data?.slug) {
							return data.title
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
			type: "richText",
			label: "Description",
			required: true,
			localized: true,
			admin: {
				description: "Detailed description of the series content and goals",
			},
		},
		{
			name: "coverImage",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Series cover image",
			},
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			required: true,
			index: true,
			admin: {
				description: "Primary author of this series",
			},
			defaultValue: ({ user }) => user?.id,
		},
		{
			name: "progress",
			type: "select",
			required: true,
			defaultValue: "planned",
			index: true,
			options: [
				{ label: "Planned", value: "planned" },
				{ label: "In Progress", value: "in-progress" },
				{ label: "Completed", value: "completed" },
				{ label: "On Hold", value: "on-hold" },
			],
		},
		{
			name: "difficulty",
			type: "select",
			defaultValue: "intermediate",
			options: [
				{ label: "Beginner", value: "beginner" },
				{ label: "Intermediate", value: "intermediate" },
				{ label: "Advanced", value: "advanced" },
			],
		},
		{
			name: "estimatedReadTime",
			type: "number",
			admin: {
				description: "Total estimated reading time in minutes",
			},
		},
		{
			name: "featured",
			type: "checkbox",
			admin: {
				description: "Feature this series prominently",
			},
		},
		{
			name: "completedAt",
			type: "date",
			admin: {
				description: "Date when series was completed",
				condition: (data) => data.progress === "completed",
			},
		},
	],
	timestamps: true,
	hooks: {
		beforeDelete: [capturePublicDeleteSnapshot("series")],
		beforeChange: [capturePublicSnapshot("series"), createBasicTranslationHook()],
		afterChange: [createRevalidationHook("series")],
		afterDelete: [createRevalidationDeleteHook("series")],
	},
}
