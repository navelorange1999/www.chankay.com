import type { CollectionConfig } from "payload"
import { structureBlocks } from "@/blocks/StructureBlocks"
import {
	capturePublicSnapshot,
	capturePublicDeleteSnapshot,
	createRevalidationDeleteHook,
	createRevalidationHook,
} from "@/hooks/revalidateWww"
import { syncPageGeneratedAssets } from "@/services/pageAssets"
import { publishedOrAuthenticated } from "@/access/publishedOrAuthenticated"
import { authenticated } from "@/access/authenticated"
import { validatePagePublication } from "@/hooks/validatePublishedMedia"
import { rejectStalePageAssetUpdate } from "@/services/pageAssets/versionGuard"

export const Pages: CollectionConfig = {
	slug: "pages",
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "slug", "_status", "updatedAt"],
	},
	access: {
		read: publishedOrAuthenticated,
		readVersions: authenticated,
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	versions: { drafts: true, maxPerDoc: 10 },
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			localized: true,
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
					localized: true,
					admin: {
						description: "Override the page title for SEO",
					},
				},
				{
					name: "metaDescription",
					type: "textarea",
					label: "Meta Description",
					localized: true,
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
						{ label: "Queued", value: "queued" },
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
		beforeDelete: [capturePublicDeleteSnapshot("pages")],
		beforeChange: [
			rejectStalePageAssetUpdate,
			capturePublicSnapshot("pages"),
			validatePagePublication,
		],
		afterChange: [createRevalidationHook("pages"), syncPageGeneratedAssets],
		afterDelete: [createRevalidationDeleteHook("pages")],
	},
}
