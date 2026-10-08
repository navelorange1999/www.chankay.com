import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { publishedOrAuthenticated } from "../access/publishedOrAuthenticated"
import {
	capturePublicSnapshot,
	capturePublicDeleteSnapshot,
	createRevalidationDeleteHook,
	createRevalidationHook,
} from "../hooks/revalidateWww"

export const Categories: CollectionConfig = {
	slug: "categories",
	access: {
		read: publishedOrAuthenticated,
		readVersions: authenticated,
		create: authenticated,
		update: authenticated,
		delete: authenticated,
	},
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "slug", "_status", "sortOrder"],
	},
	versions: { drafts: true, maxPerDoc: 10 },
	hooks: {
		beforeChange: [capturePublicSnapshot("categories")],
		beforeDelete: [
			capturePublicDeleteSnapshot("categories"),
			async ({ id, req }) => {
				for (const draft of [false, true]) {
					const result = await req.payload.find({
						collection: "posts",
						where: { category: { equals: id } },
						draft,
						depth: 0,
						limit: 1,
						overrideAccess: true,
						req,
					})
					if (result.totalDocs > 0) throw new Error("This category is still used by a post.")
				}
			},
		],
		afterChange: [createRevalidationHook("categories")],
		afterDelete: [createRevalidationDeleteHook("categories")],
	},
	fields: [
		{ name: "name", type: "text", required: true, localized: true },
		{ name: "slug", type: "text", required: true, unique: true, index: true },
		{ name: "description", type: "textarea", localized: true },
		{ name: "sortOrder", type: "number", defaultValue: 0 },
		{
			name: "colorToken",
			type: "select",
			options: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
		},
		{
			name: "posts",
			type: "join",
			collection: "posts",
			on: "category",
			defaultLimit: 10,
			maxDepth: 1,
		},
	],
}
