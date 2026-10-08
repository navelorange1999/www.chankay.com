import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"

// Exercise the retained historical engine; cutover.test.ts checks the real retirement boundary.
vi.mock("../writeAvailability", () => ({ requireMigrationWritesAvailable: vi.fn() }))

import { applyMigration, inspectMigration, rollbackMigration, verifyMigration } from "../executor"

const timestamp = "2026-09-01T00:00:00.000Z"
const cutoff = "2026-10-01T00:00:00.000Z"
beforeEach(() => {
	vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
	vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", cutoff)
})
afterEach(() => vi.unstubAllEnvs())
const input = {
	collection: "pages" as const,
	id: "page1",
	phase: "publication" as const,
	legacyBefore: cutoff,
}

function fixture(collection = "pages") {
	let record: Record<string, unknown> = {
		id: "page1",
		createdAt: timestamp,
		updatedAt: timestamp,
		status: "published",
		title: { en: "Home", "zh-CN": "首页" },
		blocks: [{ id: "block1", content: "preserved" }],
	}
	let versions: Record<string, unknown>[] = []
	const journals: Record<string, unknown>[] = []
	const db = {
		find: vi.fn(async (args) => ({
			docs: args.collection === collection ? [record] : [],
			totalDocs: args.collection === collection ? 1 : 0,
		})),
		findVersions: vi.fn(async () => ({ docs: versions, totalDocs: versions.length })),
		beginTransaction: vi.fn(async () => "transaction1"),
		commitTransaction: vi.fn(async () => {}),
		rollbackTransaction: vi.fn(async () => {}),
	}
	const payload = {
		db,
		update: vi.fn(async (args) => {
			record = { ...record, ...args.data, updatedAt: "2026-10-02T00:00:00.000Z" }
			versions = [{ id: "version1", updatedAt: record.updatedAt, version: { ...record } }]
			return record
		}),
		create: vi.fn(async (args) => {
			const doc = { id: `run${journals.length + 1}`, ...args.data }
			journals.push(doc)
			return doc
		}),
		findByID: vi.fn(async () => journals[0]),
	}
	return {
		req: { user: { id: "operator" }, payload } as unknown as PayloadRequest,
		payload,
		db,
		edit: (patch: Record<string, unknown>) => {
			record = { ...record, ...patch }
		},
		draft: (status = "draft") => {
			versions = [{ id: "draft1", version: { ...record, _status: status } }]
		},
		journals,
	}
}

describe("guarded content migration", () => {
	it("requires authentication before accessing records", async () => {
		const { req, db } = fixture()
		req.user = null
		await expect(inspectMigration(req, input)).rejects.toThrow("Authentication")
		expect(db.find).not.toHaveBeenCalled()
	})
	it("returns a bounded review with no content bodies and requires explicit Page snapshot approval", async () => {
		const { req } = fixture()
		const plan = await inspectMigration(req, input)
		expect(plan.expectedUpdatedAt).toBe(timestamp)
		expect(plan.requiresCurrentSnapshotApproval).toBe(true)
		expect(JSON.stringify(plan)).not.toContain("preserved")
		await expect(
			applyMigration(req, { ...input, expectedUpdatedAt: timestamp, planHash: plan.planHash })
		).rejects.toThrow("snapshot approval")
	})
	it("rejects changes since review, including version-only drafts", async () => {
		const { req, draft, payload } = fixture()
		const plan = await inspectMigration(req, input)
		draft()
		await expect(
			applyMigration(req, {
				...input,
				expectedUpdatedAt: timestamp,
				planHash: plan.planHash,
				approveCurrentSnapshot: true,
			})
		).rejects.toThrow()
		expect(payload.update).not.toHaveBeenCalled()
	})
	it("publishes exactly the reviewed snapshot transactionally and journals guarded rollback metadata", async () => {
		const { req, payload, db, journals } = fixture()
		const plan = await inspectMigration(req, input)
		const result = await applyMigration(req, {
			...input,
			expectedUpdatedAt: timestamp,
			planHash: plan.planHash,
			approveCurrentSnapshot: true,
		})
		expect(result.runId).toBe("run1")
		expect(payload.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { _status: "published" },
				overrideAccess: false,
				req: expect.objectContaining({
					transactionID: "transaction1",
					user: { id: "operator" },
					context: expect.objectContaining({
						skipGeneratedPageAssets: true,
						expectedGeneratedPageUpdatedAt: timestamp,
					}),
				}),
			})
		)
		expect(db.commitTransaction).toHaveBeenCalledWith("transaction1")
		// Avoid parallel document/count queries when starting a MongoDB transaction.
		expect(db.find).toHaveBeenCalledWith(
			expect.objectContaining({ collection: "pages", limit: 1, pagination: false })
		)
		expect(journals[0]).toMatchObject({
			before: { nativeStatus: null },
			after: { nativeStatus: "published" },
		})
		expect(await verifyMigration(req, "run1")).toMatchObject({
			verified: true,
			rollbackEligible: false,
			rollbackStrategy: "compatible-code",
		})
		expect((await inspectMigration(req, input)).patch).toEqual({})
	})
	it("rejects databases without transactions", async () => {
		const { req, db, payload } = fixture()
		const plan = await inspectMigration(req, input)
		db.beginTransaction.mockResolvedValueOnce(null as unknown as string)
		await expect(
			applyMigration(req, {
				...input,
				expectedUpdatedAt: timestamp,
				planHash: plan.planHash,
				approveCurrentSnapshot: true,
			})
		).rejects.toThrow("transaction")
		expect(payload.update).not.toHaveBeenCalled()
	})
	it("does not offer rollback after later editorial changes", async () => {
		const { req, edit } = fixture()
		const plan = await inspectMigration(req, input)
		await applyMigration(req, {
			...input,
			expectedUpdatedAt: timestamp,
			planHash: plan.planHash,
			approveCurrentSnapshot: true,
		})
		edit({ title: { en: "Changed" } })
		expect(await verifyMigration(req, "run1")).toMatchObject({
			verified: false,
			rollbackEligible: false,
		})
	})
	it("rejects a changed body even if the main timestamp was preserved", async () => {
		const { req, edit, payload } = fixture()
		const plan = await inspectMigration(req, input)
		edit({ blocks: [{ content: "new editorial content" }] })
		await expect(
			applyMigration(req, {
				...input,
				expectedUpdatedAt: timestamp,
				planHash: plan.planHash,
				approveCurrentSnapshot: true,
			})
		).rejects.toThrow("snapshot changed")
		expect(payload.update).not.toHaveBeenCalled()
	})
	it("rolls back when a hook unexpectedly changes protected content", async () => {
		const { req, edit, payload, db } = fixture()
		const plan = await inspectMigration(req, input)
		const update = payload.update.getMockImplementation()!
		payload.update.mockImplementationOnce(async (args) => {
			const result = await update(args)
			edit({ blocks: [] })
			return result
		})
		await expect(
			applyMigration(req, {
				...input,
				expectedUpdatedAt: timestamp,
				planHash: plan.planHash,
				approveCurrentSnapshot: true,
			})
		).rejects.toThrow("Protected content")
		expect(db.rollbackTransaction).toHaveBeenCalledWith("transaction1")
		expect(db.commitTransaction).not.toHaveBeenCalled()
		expect(payload.create).not.toHaveBeenCalled()
	})
	it("requires dependency migration before Pages", async () => {
		const { req, db, payload } = fixture()
		const plan = await inspectMigration(req, input)
		const find = db.find.getMockImplementation()!
		db.find.mockImplementation(async (args) =>
			args.collection === "media" ? { docs: [{ id: "legacy-media" }], totalDocs: 1 } : find(args)
		)
		await expect(
			applyMigration(req, {
				...input,
				expectedUpdatedAt: timestamp,
				planHash: plan.planHash,
				approveCurrentSnapshot: true,
			})
		).rejects.toThrow("Migrate legacy media")
		expect(payload.update).not.toHaveBeenCalled()
	})
	it("never treats unrecognized native states as missing", async () => {
		const { req, edit } = fixture()
		edit({ _status: "uncertain-state" })
		await expect(inspectMigration(req, input)).rejects.toThrow("Unknown native")
	})
	it("initializes native versions even when the stored status already matches", async () => {
		const { req, edit } = fixture()
		edit({ _status: "published" })
		const plan = await inspectMigration(req, input)
		expect(plan.patch).toEqual({ _status: "published" })
	})
	it("reviews historical snapshots independently of live compatibility settings", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "native")
		const { req } = fixture()
		await expect(inspectMigration(req, input)).resolves.toMatchObject({ legacyBefore: cutoff })
	})

	it("rejects historical taxonomy planning without querying retired Tags", async () => {
		const { req, edit, db, payload } = fixture("posts")
		edit({
			_status: "published",
			category: null,
			primaryTag: "6a9a8cb31fd8dde63da92e17",
			tags: ["topic1"],
		})
		const target = { ...input, collection: "posts" as const, phase: "taxonomy" as const }
		await expect(inspectMigration(req, target)).rejects.toThrow("Tags are retired")
		expect(db.find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: "tags" }))
		expect(payload.update).not.toHaveBeenCalled()
	})
	it("retains additive native initialization and requires compatible-code rollback", async () => {
		const { req } = fixture()
		const plan = await inspectMigration(req, input)
		await applyMigration(req, {
			...input,
			expectedUpdatedAt: timestamp,
			planHash: plan.planHash,
			approveCurrentSnapshot: true,
		})
		await expect(rollbackMigration(req, "run1")).rejects.toThrow("compatible application")
	})
	it("rejects malformed latest publication versions", async () => {
		const { req, draft } = fixture()
		draft("unknown")
		await expect(inspectMigration(req, input)).rejects.toThrow("Unknown native version")
	})
})
