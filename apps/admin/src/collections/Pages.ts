import type { CollectionConfig } from "payload"
import { structureBlocks } from "@/blocks/StructureBlocks"
import { syncPageGeneratedAssets } from "@/services/pageAssets"

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
			name: "structure",
			type: "blocks",
			label: "Page Structure",
			admin: {
				description: "Build your page by nesting Structure and Content blocks (max depth: 4)",
			},
			blocks: structureBlocks,
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
				{
					name: "autoGenerateOgImage",
					type: "checkbox",
					label: "Auto Generate OG Image",
					defaultValue: false,
					admin: {
						description:
							"Generate a screenshot-based OG image from the latest preview page after saving.",
					},
				},
				{
					name: "waitForMs",
					type: "number",
					label: "OG Wait Before Capture (ms)",
					defaultValue: 1500,
					min: 0,
					admin: {
						condition: (_, siblingData) => siblingData?.autoGenerateOgImage === true,
						description: "Milliseconds to wait before capturing the auto-generated OG image.",
					},
				},
				{
					name: "ogGenerationStatus",
					type: "select",
					label: "OG Generation Status",
					defaultValue: "idle",
					admin: {
						readOnly: true,
						description: "Managed automatically after save when auto generation is enabled.",
					},
					options: [
						{ label: "Idle", value: "idle" },
						{ label: "Generating", value: "generating" },
						{ label: "Ready", value: "ready" },
						{ label: "Failed", value: "failed" },
					],
				},
				{
					name: "ogImage",
					type: "upload",
					label: "Open Graph Image",
					relationTo: "media",
					admin: {
						description:
							"When auto generation is enabled this field is updated automatically after save.",
					},
				},
			],
		},
	],
	timestamps: true,
	hooks: {
		afterChange: [syncPageGeneratedAssets],
	},
}
