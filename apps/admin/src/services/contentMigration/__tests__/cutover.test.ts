import { afterEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"
import { migrationTools } from "@/plugins/mcp/migration"
import { createMigrationCategory } from "../categories"
import {
	applyMigration,
	migrationHash,
	migrationTransaction,
	rollbackMigration,
	verifyMigration,
} from "../executor"

afterEach(() => vi.unstubAllEnvs())

describe("native publication migration cutover", () => {
	it("only exposes authenticated read-only migration tools", async () => {
		expect(migrationTools.map((tool) => tool.name)).toEqual([
			"content_migration_inventory",
			"content_migration_review",
			"content_migration_verify",
		])
		for (const tool of migrationTools) {
			await expect(tool.handler({}, { user: null } as PayloadRequest)).rejects.toThrow(
				"Authentication"
			)
		}
	})

	it.each(["compatibility", "native", ""])(
		"rejects every migration write before database access in %s mode",
		async (mode) => {
			vi.stubEnv("CONTENT_PUBLICATION_MODE", mode)
			vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-01T00:00:00.000Z")
			const beginTransaction = vi.fn()
			const update = vi.fn()
			const create = vi.fn()
			const operation = vi.fn()
			const req = {
				user: { id: "operator" },
				payload: { db: { beginTransaction }, update, create },
			} as unknown as PayloadRequest
			const input = {
				collection: "pages" as const,
				id: "page1",
				phase: "publication" as const,
				legacyBefore: "2026-10-01T00:00:00.000Z",
				expectedUpdatedAt: "2026-09-01T00:00:00.000Z",
				planHash: "a".repeat(64),
			}
			await expect(applyMigration(req, input)).rejects.toThrow("writes are retired")
			await expect(rollbackMigration(req, "run1")).rejects.toThrow("writes are retired")
			await expect(
				createMigrationCategory(req, {
					slug: "technical",
					nameEn: "Technical",
					nameZh: "Technical",
					publish: true,
					legacyBefore: input.legacyBefore,
				})
			).rejects.toThrow("writes are retired")
			await expect(migrationTransaction(req, operation)).rejects.toThrow("writes are retired")
			for (const spy of [beginTransaction, update, create, operation])
				expect(spy).not.toHaveBeenCalled()
		}
	)

	it("verifies preserved journals without advertising an available rollback write", async () => {
		const record = { id: "post1", updatedAt: "2026-10-01T00:00:00.000Z", _status: "published" }
		const latest = { id: "version1", version: record }
		const run = {
			collectionSlug: "posts",
			recordId: "post1",
			operation: "taxonomy",
			before: { category: null },
			afterSnapshotHash: migrationHash(record),
			afterVersionHash: migrationHash({ total: 1, latest }),
			afterUpdatedAt: record.updatedAt,
		}
		const req = {
			user: { id: "operator" },
			payload: {
				findByID: vi.fn().mockResolvedValue(run),
				db: {
					find: vi.fn().mockResolvedValue({ docs: [record] }),
					findVersions: vi.fn().mockResolvedValue({ docs: [latest], totalDocs: 1 }),
				},
			},
		} as unknown as PayloadRequest
		await expect(verifyMigration(req, "run1")).resolves.toMatchObject({
			verified: true,
			rollbackEligible: false,
			rollbackWritesAvailable: false,
			historicalRollbackEligible: true,
		})
	})
})
