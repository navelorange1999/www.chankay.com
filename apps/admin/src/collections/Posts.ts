import type {CollectionConfig} from "payload";
import {authenticated} from "../access/authenticated";
import {LOCALE_CONFIG, getLocaleOptions} from "../config/locales";
import {createAdvancedTranslationHook} from "../hooks/createTranslationHook";

export const Posts: CollectionConfig = {
	slug: "posts",
	access: {
		read: ({req}) => {
			// Public posts are readable by anyone
			// Draft posts only by authenticated users
			if (req.user) return true;
			return {
				status: {equals: "published"},
			};
		},
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		defaultColumns: [
			"title",
			"status",
			"publishedAt",
			"author",
			"primaryLanguage",
		],
		useAsTitle: "title",
		preview: (doc) => {
			return `${process.env.SITE_URL || "http://localhost:3000"}/posts/${doc.slug}`;
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
		// === Language Management ===
		{
			name: "primaryLanguage",
			type: "select",
			label: "Primary Language",
			required: true,
			defaultValue: LOCALE_CONFIG.locales[0].code,
			options: getLocaleOptions(),
			admin: {
				position: "sidebar",
				description: "The original language this post was written in",
			},
		},

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
					({data}) => {
						if (data?.title && !data?.slug) {
							return data.title
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
			name: "excerpt",
			type: "textarea",
			label: "Excerpt",
			localized: true,
			admin: {
				description: "Brief summary for previews and SEO",
				placeholder: "Write a compelling excerpt...",
			},
		},
		{
			name: "content",
			type: "richText",
			label: "Content",
			required: true,
			localized: true,
			admin: {
				description: "Main article content",
			},
		},

		// === Media ===
		{
			name: "featuredImage",
			type: "upload",
			relationTo: "media",
			admin: {
				position: "sidebar",
				description: "自定义封面图（留空则自动从内容中提取第一张图片）",
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
				{label: "Draft", value: "draft"},
				{label: "Published", value: "published"},
				{label: "Archived", value: "archived"},
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
					({data, value}) => {
						if (data?.status === "published" && !value) {
							return new Date();
						}
						return value;
					},
				],
			},
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			required: true,
			index: true,
			admin: {
				position: "sidebar",
			},
			defaultValue: ({user}) => user?.id,
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
			name: "categories",
			type: "relationship",
			relationTo: "categories",
			hasMany: true,
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "tags",
			type: "relationship",
			relationTo: "tags",
			hasMany: true,
			admin: {
				position: "sidebar",
				description: "Tags for better discoverability",
			},
		},

		// === SEO ===
		{
			type: "collapsible",
			label: "SEO",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "seo",
					type: "group",
					fields: [
						{
							name: "title",
							type: "text",
							label: "Meta Title",
							localized: true,
							admin: {
								placeholder:
									"Custom SEO title (leave empty to use post title)",
								description: "Recommended: 50-60 characters",
							},
						},
						{
							name: "description",
							type: "textarea",
							label: "Meta Description",
							localized: true,
							admin: {
								placeholder:
									"Meta description for search engines",
								description: "Recommended: 150-160 characters",
							},
						},
						{
							name: "keywords",
							type: "text",
							label: "Keywords",
							localized: true,
							admin: {
								placeholder: "Comma-separated keywords",
							},
						},
						{
							name: "noIndex",
							type: "checkbox",
							admin: {
								description:
									"Prevent search engines from indexing",
							},
						},
					],
				},
			],
		},

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
							({data}) => {
								if (data?.content) {
									// Simple word count estimation: 200 WPM
									const wordCount = JSON.stringify(
										data.content
									)
										.replace(/<[^>]*>/g, "")
										.split(/\s+/).length;
									return Math.ceil(wordCount / 200);
								}
								return 0;
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
		beforeChange: [
			createAdvancedTranslationHook(
				[
					"title",
					"excerpt",
					"content",
					"seo.title",
					"seo.description",
					"seo.keywords",
				],
				"technical" // Blog posts are often technical content
			),
		],
	},
};
