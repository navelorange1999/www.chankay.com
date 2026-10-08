import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"

// Exercise the retained historical engine; cutover.test.ts checks the real retirement boundary.
vi.mock("../writeAvailability", () => ({ requireMigrationWritesAvailable: vi.fn() }))
import { createMigrationCategory } from "../categories"

beforeEach(() => {
	vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
	vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-01T00:00:00.000Z")
})
afterEach(() => vi.unstubAllEnvs())

function fixture() {
	let category: Record<string, unknown> | null = null
	let version: Record<string, unknown> | null = null
	const create = vi.fn(async (args) => {
		if (args.collection === "content-migration-runs") return { id: "run1" }
		category = {
			id: "category1",
			...args.data,
			name: { en: args.data.name },
			updatedAt: "2026-10-01T00:00:00.000Z",
		}
		return category
	})
	const update = vi.fn(async (args) => {
		category = {
			...category,
			_status: args.data._status,
			name: { ...(category!.name as object), [args.locale]: args.data.name },
			updatedAt: "2026-10-02T00:00:00.000Z",
		}
		version = { id: "version1", version: category }
		return category
	})
	const req = {
		user: { id: "operator" },
		payload: {
			create,
			update,
			db: {
				beginTransaction: vi.fn(async () => "transaction1"),
				commitTransaction: vi.fn(),
				rollbackTransaction: vi.fn(),
				find: vi.fn(async (args) => ({
					docs: args.collection === "categories" && category ? [category] : [],
				})),
				findVersions: vi.fn(async () => ({
					docs: version ? [version] : [],
					totalDocs: version ? 1 : 0,
				})),
			},
		},
	} as unknown as PayloadRequest
	return { req, create, update }
}
const input = {
	slug: "technical" as const,
	nameEn: "Technical",
	nameZh: "技术",
	publish: true as const,
	legacyBefore: "2026-10-01T00:00:00.000Z",
}

describe("approved migration Categories", () => {
	it("rejects unapproved slugs and implicit publication", async () => {
		const { req, create } = fixture()
		await expect(
			createMigrationCategory(req, { ...input, slug: "guessed" as "technical" })
		).rejects.toThrow("approved")
		await expect(
			createMigrationCategory(req, { ...input, publish: false as true })
		).rejects.toThrow("publication")
		expect(create).not.toHaveBeenCalled()
	})
	it("creates bilingual content in one transaction and journals explicit publication", async () => {
		const { req, create, update } = fixture()
		expect(await createMigrationCategory(req, input)).toMatchObject({
			changed: true,
			id: "category1",
			runId: "run1",
		})
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "categories",
				locale: "en",
				overrideAccess: false,
				data: { slug: "technical", name: "Technical", _status: "published" },
			})
		)
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				locale: "zh-CN",
				overrideAccess: false,
				data: { name: "技术", _status: "published" },
			})
		)
		expect(await createMigrationCategory(req, input)).toMatchObject({
			changed: false,
			id: "category1",
		})
		await expect(createMigrationCategory(req, { ...input, nameEn: "Different" })).rejects.toThrow(
			"conflicts"
		)
	})
})
