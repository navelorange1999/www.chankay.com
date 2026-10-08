import { createHash } from "node:crypto"
import type { PayloadRequest } from "payload"

import { planPublication, type PublicationCollection } from "../publicationMigration/plan"
import { planPostTaxonomy } from "../taxonomyMigration/plan"
import { publicationCompatibilityCutoff } from "../publicationCompatibility"
import {
	EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY,
	GENERATION_CONTEXT_FLAG,
} from "../pageAssets/constants"

type RecordData = Record<string, unknown> & { id: string; updatedAt: string }
export type MigrationInput = {
	collection: PublicationCollection
	id: string
	phase: "publication" | "taxonomy"
	legacyBefore: string
}
type ApplyInput = MigrationInput & {
	expectedUpdatedAt: string
	planHash: string
	approveCurrentSnapshot?: boolean
}
const collections = ["media", "tags", "series", "posts", "pages"]
const mappings = {
	"6a9a8cb31fd8dde63da92e17": "technical",
	"6a9e55ea926cdf8d848318b3": "trading",
} as const

export function requireMigrationUser(req: PayloadRequest) {
	if (!req?.user) throw new Error("Authentication is required for content migration.")
}
function validId(id: unknown): asserts id is string {
	if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id))
		throw new Error("Invalid record ID.")
}
export function requireMigrationCutoff(cutoff: string) {
	if (!publicationCompatibilityCutoff() || publicationCompatibilityCutoff() !== cutoff)
		throw new Error("Migration requires the configured compatibility cutoff.")
}
function validateInput(input: MigrationInput) {
	validId(input.id)
	if (!collections.includes(input.collection) || !["publication", "taxonomy"].includes(input.phase))
		throw new Error("Invalid migration target.")
	if (input.phase === "taxonomy" && input.collection !== "posts")
		throw new Error("Taxonomy migration only supports Posts.")
	if (
		!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.legacyBefore) ||
		!Number.isFinite(Date.parse(input.legacyBefore))
	)
		throw new Error("A valid legacy cutoff is required.")
	requireMigrationCutoff(input.legacyBefore)
}
function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical)
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, item]) => [key, canonical(item)])
		)
	return value
}
export function migrationHash(value: unknown): string {
	return createHash("sha256")
		.update(JSON.stringify(canonical(JSON.parse(JSON.stringify(value)))))
		.digest("hex")
}
export async function migrationSnapshot(
	req: PayloadRequest,
	collection: PublicationCollection | "categories",
	id: string
) {
	const result = await req.payload.db.find<RecordData>({
		collection,
		where: { id: { equals: id } },
		locale: "all",
		limit: 1,
		req,
	})
	const record = result.docs[0]
	if (!record || String(record.id) !== id) throw new Error("Migration record was not found.")
	const versions = await req.payload.db.findVersions<RecordData>({
		collection,
		where: { parent: { equals: id } },
		locale: "all",
		limit: 1,
		sort: "-updatedAt",
		req,
	})
	const latest = versions.docs[0] ?? null
	return {
		record,
		latest,
		snapshotHash: migrationHash(record),
		versionHash: migrationHash({ total: versions.totalDocs, latest }),
	}
}
function affected(record: RecordData) {
	return {
		nativeStatus: record._status ?? null,
		legacyStatus: record.status ?? null,
		progress: record.progress ?? null,
		category: record.category ?? null,
		primaryTag: record.primaryTag ?? null,
		tags: record.tags ?? [],
	}
}
function protectedHash(record: RecordData, patch: Record<string, unknown>) {
	const excluded = new Set(["updatedAt", "_status", "status", ...Object.keys(patch)])
	return migrationHash(
		Object.fromEntries(Object.entries(record).filter(([key]) => !excluded.has(key)))
	)
}
async function approvedCategoryMapping(req: PayloadRequest) {
	const result: Record<string, string> = {}
	for (const [tagId, slug] of Object.entries(mappings)) {
		const categories = await req.payload.db.find<RecordData>({
			collection: "categories",
			where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
			limit: 2,
			req,
		})
		if (categories.docs.length !== 1)
			throw new Error(`Exactly one published ${slug} Category is required.`)
		const tags = await req.payload.db.find<RecordData>({
			collection: "tags",
			where: { and: [{ id: { equals: tagId } }, { _status: { equals: "published" } }] },
			limit: 1,
			req,
		})
		if (tags.docs.length !== 1)
			throw new Error("Approved classification Tags must be published first.")
		result[tagId] = String(categories.docs[0]!.id)
	}
	return result
}
async function inspectInternal(req: PayloadRequest, input: MigrationInput) {
	requireMigrationUser(req)
	validateInput(input)
	const current = await migrationSnapshot(req, input.collection, input.id)
	const { record, latest } = current
	if (record._status != null && record._status !== "draft" && record._status !== "published")
		throw new Error("Unknown native publication state requires review.")
	if (typeof record.updatedAt !== "string" || !Number.isFinite(Date.parse(record.updatedAt)))
		throw new Error("A current timestamp is required.")
	if (latest?.version?._status === "draft")
		throw new Error("A pending draft requires separate editorial reconciliation.")
	if (latest && latest.version?._status !== "published")
		throw new Error("Unknown native version publication state requires review.")
	if (!Number.isFinite(Date.parse(String(record.createdAt))))
		throw new Error("A valid creation timestamp is required.")
	const patch: Record<string, unknown> = {}
	let requiresCurrentSnapshotApproval = false
	if (input.phase === "publication") {
		const plan = planPublication({
			collection: input.collection,
			legacyStatus: typeof record.status === "string" ? record.status : null,
			nativeStatus:
				record._status === "published" || record._status === "draft" ? record._status : null,
			isLegacyRecord: Date.parse(String(record.createdAt)) < Date.parse(input.legacyBefore),
			hasChangedSinceCutoff: Date.parse(record.updatedAt) >= Date.parse(input.legacyBefore),
			hasNewerDraft: false,
			currentProgress: typeof record.progress === "string" ? record.progress : null,
		})
		if (plan.decision === "review") {
			if (
				(input.collection === "pages" || input.collection === "posts") &&
				record.status === "published" &&
				record._status !== "published" &&
				Date.parse(String(record.createdAt)) < Date.parse(input.legacyBefore)
			) {
				requiresCurrentSnapshotApproval = true
				patch._status = "published"
			} else throw new Error(plan.reason ?? "Editorial reconciliation is required.")
		} else if (plan.decision === "update") {
			patch._status = plan.targetStatus
			if (plan.progress) patch.progress = plan.progress
		} else if (!latest && (record._status === "published" || record._status === "draft")) {
			patch._status = record._status
		}
	} else {
		if (record._status !== "published")
			throw new Error(
				"This bounded taxonomy migration requires an existing native published snapshot."
			)
		const relation = (value: unknown) => (typeof value === "string" ? value : null)
		if (
			(record.category != null && !relation(record.category)) ||
			(record.primaryTag != null && !relation(record.primaryTag)) ||
			!Array.isArray(record.tags) ||
			record.tags.some((tag) => typeof tag !== "string")
		)
			throw new Error("Unexpected relationship storage requires review.")
		const plan = planPostTaxonomy(
			{
				id: input.id,
				category: relation(record.category),
				primaryTag: relation(record.primaryTag),
				tags: record.tags as string[],
			},
			await approvedCategoryMapping(req)
		)
		if (plan.reviewReason || !plan.category)
			throw new Error(plan.reviewReason ?? "An explicit Category assignment is required.")
		if (plan.changed) Object.assign(patch, { category: plan.category, tags: plan.tags })
	}
	const plan = {
		collection: input.collection,
		id: input.id,
		phase: input.phase,
		legacyBefore: input.legacyBefore,
		expectedUpdatedAt: record.updatedAt,
		snapshotHash: current.snapshotHash,
		versionHash: current.versionHash,
		latestVersionId: latest?.id ? String(latest.id) : null,
		before: affected(record),
		patch,
		requiresCurrentSnapshotApproval,
	}
	return { current, plan: { ...plan, planHash: migrationHash(plan) } }
}
export async function inspectMigration(req: PayloadRequest, input: MigrationInput) {
	return (await inspectInternal(req, input)).plan
}
export async function migrationTransaction<T>(
	req: PayloadRequest,
	operation: (transactionReq: PayloadRequest) => Promise<T>
): Promise<T> {
	requireMigrationUser(req)
	if (req.transactionID) throw new Error("Migration must own its transaction.")
	const transactionID = await req.payload.db.beginTransaction()
	if (transactionID == null) throw new Error("A database transaction is required for migration.")
	const transactionReq = Object.assign(Object.create(req), {
		transactionID,
		context: { ...req.context, contentMigrationJournal: true },
	}) as PayloadRequest
	try {
		const result = await operation(transactionReq)
		await req.payload.db.commitTransaction(transactionID)
		return result
	} catch (error) {
		await req.payload.db.rollbackTransaction(transactionID)
		throw error
	}
}
export async function requireMigrationDependencies(
	req: PayloadRequest,
	collection: PublicationCollection | "categories",
	cutoff: string
) {
	if (!["categories", "posts", "pages"].includes(collection)) return
	for (const dependency of ["media", "tags", "series"] as const) {
		const remaining = await req.payload.db.find({
			collection: dependency,
			where: {
				and: [{ createdAt: { less_than: cutoff } }, { _status: { not_equals: "published" } }],
			},
			limit: 1,
			select: { id: true },
			req,
		})
		if (remaining.docs.length) throw new Error(`Migrate legacy ${dependency} before ${collection}.`)
	}
}
export async function applyMigration(req: PayloadRequest, input: ApplyInput) {
	requireMigrationUser(req)
	validateInput(input)
	if (!/^[a-f0-9]{64}$/.test(input.planHash)) throw new Error("A reviewed plan hash is required.")
	return migrationTransaction(req, async (transactionReq) => {
		const { current, plan } = await inspectInternal(transactionReq, input)
		if (plan.planHash !== input.planHash || plan.expectedUpdatedAt !== input.expectedUpdatedAt)
			throw new Error("The reviewed snapshot changed; inspect and review again.")
		if (plan.requiresCurrentSnapshotApproval && input.approveCurrentSnapshot !== true)
			throw new Error("Explicit current snapshot approval is required.")
		if (Object.keys(plan.patch).length === 0) return { changed: false, runId: null }
		await requireMigrationDependencies(transactionReq, input.collection, input.legacyBefore)
		if (input.collection === "pages") {
			transactionReq.context[GENERATION_CONTEXT_FLAG] = true
			transactionReq.context[EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY] = current.record.updatedAt
		}
		await req.payload.update({
			collection: input.collection,
			id: input.id,
			data: plan.patch,
			draft: false,
			locale: "en",
			depth: 0,
			overrideAccess: false,
			req: transactionReq,
		})
		const after = await migrationSnapshot(transactionReq, input.collection, input.id)
		if (protectedHash(current.record, plan.patch) !== protectedHash(after.record, plan.patch)) {
			const changedFields = [
				...new Set([...Object.keys(current.record), ...Object.keys(after.record)]),
			]
				.filter(
					(key) => !["updatedAt", "_status", "status", ...Object.keys(plan.patch)].includes(key)
				)
				.filter(
					(key) =>
						migrationHash(current.record[key] ?? null) !== migrationHash(after.record[key] ?? null)
				)
			throw new Error(
				`Protected content changed; migration was rolled back. Fields: ${changedFields.join(", ")}`
			)
		}
		if (
			Object.entries(plan.patch).some(
				([key, value]) => migrationHash(after.record[key] ?? null) !== migrationHash(value ?? null)
			) ||
			!after.latest ||
			after.latest.version._status !== after.record._status
		)
			throw new Error("Native snapshot/version verification failed.")
		const journal = await req.payload.create({
			collection: "content-migration-runs",
			data: {
				operation: input.phase,
				collectionSlug: input.collection,
				recordId: input.id,
				operatorId: String(req.user!.id),
				planHash: input.planHash,
				before: plan.before,
				after: affected(after.record),
				beforeSnapshotHash: current.snapshotHash,
				afterSnapshotHash: after.snapshotHash,
				beforeVersionHash: current.versionHash,
				afterVersionHash: after.versionHash,
				beforeVersionId: plan.latestVersionId,
				afterVersionId: String(after.latest.id),
				beforeUpdatedAt: current.record.updatedAt,
				afterUpdatedAt: after.record.updatedAt,
			},
			overrideAccess: false,
			req: transactionReq,
		})
		return { changed: true, runId: String(journal.id), afterUpdatedAt: after.record.updatedAt }
	})
}
export async function verifyMigration(req: PayloadRequest, runId: string) {
	requireMigrationUser(req)
	validId(runId)
	const run = await req.payload.findByID({
		collection: "content-migration-runs",
		id: runId,
		depth: 0,
		overrideAccess: false,
		req,
	})
	const current = await migrationSnapshot(
		req,
		run.collectionSlug as PublicationCollection | "categories",
		run.recordId
	)
	const verified =
		current.snapshotHash === run.afterSnapshotHash &&
		current.versionHash === run.afterVersionHash &&
		current.record.updatedAt === run.afterUpdatedAt
	const before = run.before as Record<string, unknown>
	const supportsDataRollback =
		run.operation === "taxonomy" ||
		(run.operation === "publication" &&
			(before.nativeStatus === "published" || before.nativeStatus === "draft"))
	return {
		runId,
		verified,
		rollbackEligible: verified && supportsDataRollback,
		rollbackStrategy: supportsDataRollback ? "guarded-data" : "compatible-code",
		currentUpdatedAt: current.record.updatedAt,
		rollback: verified
			? {
					before: run.before,
					expectedAfter: run.after,
					expectedSnapshotHash: run.afterSnapshotHash,
					expectedVersionHash: run.afterVersionHash,
					beforeVersionId: run.beforeVersionId,
					afterVersionId: run.afterVersionId,
				}
			: null,
	}
}

export async function rollbackMigration(req: PayloadRequest, runId: string) {
	requireMigrationUser(req)
	validId(runId)
	if (!publicationCompatibilityCutoff())
		throw new Error("Rollback requires compatible application mode.")
	return migrationTransaction(req, async (transactionReq) => {
		const run = await req.payload.findByID({
			collection: "content-migration-runs",
			id: runId,
			depth: 0,
			overrideAccess: false,
			req: transactionReq,
		})
		const current = await migrationSnapshot(
			transactionReq,
			run.collectionSlug as PublicationCollection | "categories",
			run.recordId
		)
		if (
			current.snapshotHash !== run.afterSnapshotHash ||
			current.versionHash !== run.afterVersionHash ||
			current.record.updatedAt !== run.afterUpdatedAt
		)
			throw new Error(
				"The migrated record or version changed; rollback requires editorial reconciliation."
			)
		const before = run.before as Record<string, unknown>
		const patch: Record<string, unknown> = {}
		if (run.operation === "taxonomy" && run.collectionSlug === "posts") {
			if (before.category !== null) validId(before.category)
			if (!Array.isArray(before.tags)) throw new Error("Invalid rollback relationships.")
			before.tags.forEach(validId)
			Object.assign(patch, { category: before.category, tags: before.tags })
			if (before.category === null) transactionReq.context.contentMigrationRollback = true
		} else if (
			run.operation === "publication" &&
			(before.nativeStatus === "published" || before.nativeStatus === "draft")
		) {
			patch._status = before.nativeStatus
			if (run.collectionSlug === "series") patch.progress = before.progress
		} else {
			throw new Error(
				"Restore the compatible application release and retain additive native versions and Categories; native initialization cannot be removed by this tool."
			)
		}
		if (run.collectionSlug === "pages") {
			transactionReq.context[GENERATION_CONTEXT_FLAG] = true
			transactionReq.context[EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY] = current.record.updatedAt
		}
		await req.payload.update({
			collection: run.collectionSlug as PublicationCollection,
			id: run.recordId,
			data: patch,
			draft: false,
			locale: "en",
			depth: 0,
			overrideAccess: false,
			req: transactionReq,
		})
		const after = await migrationSnapshot(
			transactionReq,
			run.collectionSlug as PublicationCollection,
			run.recordId
		)
		if (
			protectedHash(current.record, patch) !== protectedHash(after.record, patch) ||
			Object.entries(patch).some(
				([key, value]) => migrationHash(after.record[key] ?? null) !== migrationHash(value ?? null)
			) ||
			!after.latest ||
			after.latest.version._status !== after.record._status
		)
			throw new Error("Rollback snapshot verification failed.")
		const journal = await req.payload.create({
			collection: "content-migration-runs",
			data: {
				operation: run.operation,
				collectionSlug: run.collectionSlug,
				recordId: run.recordId,
				operatorId: String(req.user!.id),
				planHash: migrationHash({
					rollbackOf: runId,
					expectedSnapshotHash: run.afterSnapshotHash,
					patch,
				}),
				before: affected(current.record),
				after: affected(after.record),
				beforeSnapshotHash: current.snapshotHash,
				afterSnapshotHash: after.snapshotHash,
				beforeVersionHash: current.versionHash,
				afterVersionHash: after.versionHash,
				beforeVersionId: current.latest ? String(current.latest.id) : null,
				afterVersionId: String(after.latest.id),
				beforeUpdatedAt: current.record.updatedAt,
				afterUpdatedAt: after.record.updatedAt,
				rollbackOf: runId,
			},
			overrideAccess: false,
			req: transactionReq,
		})
		return { changed: true, runId: String(journal.id), rollbackOf: runId }
	})
}
