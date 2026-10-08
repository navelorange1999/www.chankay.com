import type { PayloadRequest } from "payload"
import { z } from "zod"

import { migrationReadAdapter } from "../../../services/contentMigration/readAdapter"
import {
	inspectMigration,
	requireMigrationUser,
	verifyMigration,
} from "../../../services/contentMigration/executor"

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
const cutoff = z.string().datetime({ precision: 3 })
const target = z
	.object({
		collection: z.enum(["media", "series", "posts", "pages"]),
		id,
		phase: z.literal("publication"),
		legacyBefore: cutoff,
	})
	.strict()
const inventory = z
	.object({
		collection: z.enum(["media", "series", "categories", "posts", "pages"]),
		page: z.number().int().min(1).max(10000).default(1),
		limit: z.number().int().min(1).max(50).default(50),
	})
	.strict()
const verify = z.object({ runId: id }).strict()
const textResult = (value: unknown) => ({
	content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
})

export const migrationTools = [
	{
		name: "content_migration_inventory",
		description:
			"Authenticated, bounded raw publication metadata inventory. Returns no article bodies. Migration writes are retired; inventory and verification are read-only.",
		parameters: inventory.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			const input = inventory.parse(args)
			const result = await migrationReadAdapter(req.payload).find({
				...input,
				sort: "id",
				locale: "all",
				projection: {
					_id: true,
					createdAt: true,
					updatedAt: true,
					status: true,
					_status: true,
					progress: true,
					category: true,
					primaryTag: true,
					tags: true,
				},
				req,
			})
			return textResult({
				...input,
				totalDocs: result.totalDocs,
				totalPages: result.totalPages,
				records: result.docs,
			})
		},
	},
	{
		name: "content_migration_review",
		description:
			"Review one native publication migration. Historical Tag taxonomy planning is retired. The deterministic hash covers all localized content and the latest version; pending drafts are rejected. No write occurs.",
		parameters: target.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await inspectMigration(req, target.parse(args)))
		},
	},
	{
		name: "content_migration_verify",
		description:
			"Verify a migration journal against the current content and version hashes. Returns historical rollback metadata only while no subsequent edits occurred; writes are unavailable in this release.",
		parameters: verify.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await verifyMigration(req, verify.parse(args).runId))
		},
	},
]
