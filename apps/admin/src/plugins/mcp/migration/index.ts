import type { PayloadRequest } from "payload"
import { z } from "zod"

import { createMigrationCategory } from "../../../services/contentMigration/categories"
import {
	applyMigration,
	inspectMigration,
	requireMigrationUser,
	rollbackMigration,
	verifyMigration,
} from "../../../services/contentMigration/executor"

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
const cutoff = z.string().datetime({ precision: 3 })
const target = z
	.object({
		collection: z.enum(["media", "tags", "series", "posts", "pages"]),
		id,
		phase: z.enum(["publication", "taxonomy"]),
		legacyBefore: cutoff,
	})
	.strict()
const apply = target
	.extend({
		expectedUpdatedAt: cutoff,
		planHash: z.string().regex(/^[a-f0-9]{64}$/),
		approveCurrentSnapshot: z.boolean().optional(),
	})
	.strict()
const inventory = z
	.object({
		collection: z.enum(["media", "tags", "series", "categories", "posts", "pages"]),
		page: z.number().int().min(1).max(10000).default(1),
		limit: z.number().int().min(1).max(50).default(50),
	})
	.strict()
const verify = z.object({ runId: id }).strict()
const category = z
	.object({
		slug: z.enum(["technical", "trading"]),
		nameEn: z.string().trim().min(1).max(100),
		nameZh: z.string().trim().min(1).max(100),
		publish: z.literal(true),
		legacyBefore: cutoff,
	})
	.strict()
const textResult = (value: unknown) => ({
	content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
})

export const migrationTools = [
	{
		name: "content_migration_inventory",
		description:
			"Authenticated, bounded raw publication metadata inventory. Returns no article bodies. Review and apply individual records with the migration tools.",
		parameters: inventory.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			const input = inventory.parse(args)
			const result = await req.payload.db.find({
				...input,
				sort: "id",
				locale: "all",
				select: {
					id: true,
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
			"Review one native publication or Post taxonomy migration. The deterministic hash covers all localized content and the latest version; pending drafts are rejected. No write occurs.",
		parameters: target.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await inspectMigration(req, target.parse(args)))
		},
	},
	{
		name: "content_migration_apply",
		description:
			"Apply exactly one reviewed migration using its expected timestamp and hash, inside a transaction. Legacy exposed Pages/Posts require explicit current-snapshot approval. Writes an immutable operational journal; never publishes pending drafts.",
		parameters: apply.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await applyMigration(req, apply.parse(args)))
		},
	},
	{
		name: "content_migration_verify",
		description:
			"Verify a migration journal against the current content and version hashes. Returns guarded rollback metadata only while no subsequent edits occurred; does not perform rollback.",
		parameters: verify.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await verifyMigration(req, verify.parse(args).runId))
		},
	},
	{
		name: "content_migration_rollback",
		description:
			"Restore captured taxonomy or supported former native states only when current content and versions still match the immutable migration journal. Requires compatibility mode. Never removes initialized versions or new Categories; those use compatible-code rollback.",
		parameters: verify.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await rollbackMigration(req, verify.parse(args).runId))
		},
	},
	{
		name: "create_migration_category",
		description:
			"Create an approved technical or trading Category with explicit English and Chinese names and publication. Transactional and idempotent for matching published content; conflicting existing categories are rejected.",
		parameters: category.shape,
		handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
			requireMigrationUser(req)
			return textResult(await createMigrationCategory(req, category.parse(args)))
		},
	},
]
