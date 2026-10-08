import type { PayloadRequest } from "payload"
import {
	migrationHash,
	migrationSnapshot,
	migrationTransaction,
	requireMigrationDependencies,
	requireMigrationCutoff,
	requireMigrationUser,
} from "./executor"

type CategoryInput = {
	slug: "technical" | "trading"
	nameEn: string
	nameZh: string
	publish: true
	legacyBefore: string
}

export async function createMigrationCategory(req: PayloadRequest, input: CategoryInput) {
	requireMigrationUser(req)
	if (!["technical", "trading"].includes(input.slug))
		throw new Error("Only approved Category slugs are allowed.")
	if (input.publish !== true) throw new Error("Explicit publication is required.")
	if (
		![input.nameEn, input.nameZh].every(
			(name) => typeof name === "string" && name.trim().length > 0 && name.length <= 100
		)
	)
		throw new Error("Both localized Category names are required.")
	if (
		!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.legacyBefore) ||
		!Number.isFinite(Date.parse(input.legacyBefore))
	)
		throw new Error("A valid legacy cutoff is required.")
	requireMigrationCutoff(input.legacyBefore)
	return migrationTransaction(req, async (transactionReq) => {
		await requireMigrationDependencies(transactionReq, "categories", input.legacyBefore)
		const existing = await req.payload.db.find<{
			id: string
			name?: Record<string, string>
			_status?: string
		}>({
			collection: "categories",
			where: { slug: { equals: input.slug } },
			locale: "all",
			limit: 2,
			req: transactionReq,
		})
		if (existing.docs.length) {
			const doc = existing.docs[0]!
			const current = await migrationSnapshot(transactionReq, "categories", String(doc.id))
			if (
				existing.docs.length !== 1 ||
				doc._status !== "published" ||
				doc.name?.en !== input.nameEn ||
				doc.name?.["zh-CN"] !== input.nameZh ||
				current.latest?.version?._status !== "published"
			)
				throw new Error(
					"Existing Category conflicts with the approved content or has an unresolved version."
				)
			return { changed: false, id: String(doc.id), runId: null }
		}
		const created = await req.payload.create({
			collection: "categories",
			data: { slug: input.slug, name: input.nameEn, _status: "published" },
			locale: "en",
			draft: false,
			overrideAccess: false,
			req: transactionReq,
		})
		await req.payload.update({
			collection: "categories",
			id: created.id,
			data: { name: input.nameZh, _status: "published" },
			locale: "zh-CN",
			draft: false,
			overrideAccess: false,
			req: transactionReq,
		})
		const after = await migrationSnapshot(transactionReq, "categories", String(created.id))
		const names = after.record.name as Record<string, unknown> | undefined
		if (
			after.record._status !== "published" ||
			names?.en !== input.nameEn ||
			names?.["zh-CN"] !== input.nameZh ||
			!after.latest ||
			after.latest.version._status !== "published"
		)
			throw new Error("Localized Category publication verification failed.")
		const run = await req.payload.create({
			collection: "content-migration-runs",
			data: {
				operation: "create-category",
				collectionSlug: "categories",
				recordId: String(created.id),
				operatorId: String(req.user!.id),
				planHash: migrationHash(input),
				before: { exists: false },
				after: { exists: true, slug: input.slug, nativeStatus: "published", name: names },
				afterSnapshotHash: after.snapshotHash,
				afterVersionHash: after.versionHash,
				afterVersionId: String(after.latest.id),
				afterUpdatedAt: after.record.updatedAt,
			},
			overrideAccess: false,
			req: transactionReq,
		})
		return { changed: true, id: String(created.id), runId: String(run.id) }
	})
}
