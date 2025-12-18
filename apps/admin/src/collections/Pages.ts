import type { CollectionConfig } from "payload"
import { HeroBlock } from "@/blocks/HeroBlock"

export const Pages: CollectionConfig = {
	slug: "pages",
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "slug", "status", "updatedAt"],
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			label: "Page Title",
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			label: "URL Slug",
			admin: {
				description: "URL path for this page (e.g., 'home', 'about')",
			},
		},
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "draft",
			options: [
				{ label: "Draft", value: "draft" },
				{ label: "Published", value: "published" },
			],
		},
		{
			name: "sections",
			type: "blocks",
			label: "Page Sections",
			admin: {
				description: "Build your page by adding, arranging, and configuring blocks",
			},
			blocks: [HeroBlock],
		},
		{
			name: "seo",
			type: "group",
			label: "SEO Settings",
			fields: [
				{
					name: "metaTitle",
					type: "text",
					label: "Meta Title",
					admin: {
						description: "Override the page title for SEO",
					},
				},
				{
					name: "metaDescription",
					type: "textarea",
					label: "Meta Description",
				},
			],
		},
	],
	timestamps: true,
}
