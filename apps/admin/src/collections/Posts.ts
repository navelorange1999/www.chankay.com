import type { CollectionConfig } from "payload"
import { POST_SLUG_MAX_LENGTH, validatePostSlug } from "@repo/i18n"
import { authenticated } from "../access/authenticated"
import { markdownField } from "../fields/markdownField"
import { createRevalidationHook } from "../hooks/revalidateWww"
import { buildPostPreviewUrl } from "../utils/postPreview"
import { estimateReadingTimeFromMarkdown } from "../utils/readingTime"
import { validatePostContent } from "./posts/validatePostContent"

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
		preview: (doc, { locale }) =>
			buildPostPreviewUrl({
				locale,
				siteUrl: process.env.WWW_SITE_URL || "http://localhost:3000",
				slug: typeof doc.slug === "string" ? doc.slug : "",
			}),
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
			maxLength: POST_SLUG_MAX_LENGTH,
			admin: {
				position: "sidebar",
				description: "URL-friendly version of the title",
			},
			validate: validatePostSlug,
			hooks: {
				beforeValidate: [
					({ data, originalDoc }) => {
						if (data?.slug === undefined && originalDoc?.slug) {
							return originalDoc.slug
						}

						if (data?.title && data.slug === undefined) {
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
			validate: validatePostContent,
			admin: {
				description: "Main article content written in Markdown. Start sections at H2.",
				placeholder: "## Start with a section heading\n\nWrite the article body here.",
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
				description:
					"Optional secondary topics. Primary Tag determines the Technical or Trading section.",
			},
		},
		{
			name: "primaryTag",
			type: "relationship",
			relationTo: "tags",
			required: true,
			admin: {
				position: "sidebar",
				description:
					"Required. Determines whether the post appears in the Technical or Trading section.",
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
					virtual: true,
					admin: {
						description: "Estimated reading time in minutes",
						readOnly: true,
					},
					hooks: {
						afterRead: [({ siblingData }) => estimateReadingTimeFromMarkdown(siblingData.content)],
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
