import type { CollectionConfig } from "payload"
import { authenticated } from "../access/authenticated"
import { markdownField } from "../fields/markdownField"
import { createRevalidationHook } from "../hooks/revalidateWww"

function getLocalizedContent(value: unknown): string {
	if (typeof value === "string") return value

	if (!value || typeof value !== "object") return ""

	const record = value as Record<string, unknown>
	const firstString = Object.values(record).find((entry) => typeof entry === "string")
	return typeof firstString === "string" ? firstString : ""
}

function estimateReadingTimeFromMarkdown(content: string): number {
	if (!content.trim()) return 0

	const plainText = content
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		.replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
		.replace(/\[[^\]]*\]\([^)]+\)/g, " ")
		.replace(/^>\s+/gm, " ")
		.replace(/^#{1,6}\s+/gm, " ")
		.replace(/[*_~#>-]/g, " ")

	const wordCount = plainText
		.split(/\s+/)
		.map((word) => word.trim())
		.filter(Boolean).length

	return wordCount > 0 ? Math.ceil(wordCount / 200) : 0
}

export const Posts: CollectionConfig = {
	slug: "posts",
	access: {
		read: ({ req }) => {
			// Public posts are readable by anyone
			// Draft posts only by authenticated users
			if (req.user) return true
			return {
				status: { equals: "published" },
			}
		},
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: ["title", "status", "publishedAt"],
		useAsTitle: "title",
		preview: (doc) => {
			return `${process.env.WWW_SITE_URL || "http://localhost:3000"}/posts/${doc.slug}`
		},
	},
	versions: {
		drafts: {
			autosave: {
				interval: 2000, // 2 seconds
			},
		},
		maxPerDoc: 10,
	},
	fields: [
		// === Core Content ===
		{
			name: "title",
			type: "text",
			label: "Title",
			required: true,
			index: true,
			localized: true,
			admin: {
				placeholder: "Enter post title...",
			},
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				position: "sidebar",
				description: "URL-friendly version of the title",
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
			name: "excerpt",
			type: "textarea",
			label: "Excerpt",
			localized: true,
			admin: {
				description: "Brief summary for previews and SEO",
				placeholder: "Write a compelling excerpt...",
			},
		},
		markdownField({
			name: "content",
			label: "Content",
			required: true,
			localized: true,
			admin: {
				description: "Main article content written in Markdown.",
				placeholder: "# Write your post\n\nStart with Markdown. Use Insert Media for assets.",
				rows: 24,
			},
		}),

		// === Media ===
		{
			name: "featuredImage",
			type: "upload",
			relationTo: "media",
			admin: {
				position: "sidebar",
				description: "Custom cover image. Leave empty to derive from the first image in content.",
			},
		},

		// === Publishing ===
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "draft",
			index: true,
			admin: {
				position: "sidebar",
			},
			options: [
				{ label: "Draft", value: "draft" },
				{ label: "Published", value: "published" },
				{ label: "Archived", value: "archived" },
			],
		},
		{
			name: "publishedAt",
			type: "date",
			index: true,
			admin: {
				position: "sidebar",
				date: {
					pickerAppearance: "dayAndTime",
				},
				condition: (data) => data.status === "published",
			},
			hooks: {
				beforeChange: [
					({ data, value }) => {
						if (data?.status === "published" && !value) {
							return new Date()
						}
						return value
					},
				],
			},
		},
		{
			name: "series",
			type: "relationship",
			relationTo: "series",
			admin: {
				position: "sidebar",
				description: "Associate this post with a series",
			},
		},
		{
			name: "seriesOrder",
			type: "number",
			admin: {
				position: "sidebar",
				description: "Order of this post within the series",
				condition: (data) => !!data.series,
			},
		},

		// === Categorization ===
		{
			name: "tags",
			type: "relationship",
			relationTo: "tags",
			hasMany: true,
			admin: {
				position: "sidebar",
				description: "Tags for categorization and discovery (first tag is treated as primary)",
			},
		},
		{
			name: "primaryTag",
			type: "relationship",
			relationTo: "tags",
			required: true,
			admin: {
				position: "sidebar",
				description: "Primary public section for this Post",
			},
		},

		// SEO fields now handled by @payloadcms/plugin-seo

		// === Performance ===
		{
			type: "collapsible",
			label: "Performance",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "readingTime",
					type: "number",
					admin: {
						description: "Estimated reading time in minutes",
						readOnly: true,
					},
					hooks: {
						beforeChange: [
							({ data }) => {
								if (data?.content) {
									return estimateReadingTimeFromMarkdown(getLocalizedContent(data.content))
								}
								return 0
							},
						],
					},
				},
				{
					name: "featured",
					type: "checkbox",
					admin: {
						position: "sidebar",
						description: "Feature this post on homepage",
					},
				},
			],
		},

		// === Analytics (Read-only) ===
		{
			type: "collapsible",
			label: "Analytics",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "views",
					type: "number",
					defaultValue: 0,
					admin: {
						readOnly: true,
						description: "Total page views",
					},
				},
			],
		},
	],
	timestamps: true,
	hooks: {
		afterChange: [createRevalidationHook("posts")],
	},
}
