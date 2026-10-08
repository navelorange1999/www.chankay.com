import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
	capturePublicSnapshot,
	capturePublicDeleteSnapshot,
	createGlobalRevalidationHook,
	createRevalidationHook,
	createRevalidationDeleteHook,
	shouldRevalidatePublicChange,
} from "../revalidateWww"

beforeEach(() => {
	vi.stubEnv("VERCEL", "")
})

afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe("public cache invalidation", () => {
	it("invalidates a native public snapshot when it becomes a private native draft", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T12:00:00.000Z")
		const findByID = vi
			.fn()
			.mockResolvedValueOnce({ id: "page", slug: "old-live", updatedAt: "1", _status: "published" })
			.mockResolvedValueOnce(null)
		const queue = vi.fn().mockResolvedValue({ id: "job" })
		const req = { context: {}, payload: { findByID, jobs: { queue } } }
		await capturePublicSnapshot("pages")({ originalDoc: { id: "page" }, req } as never)
		await createRevalidationHook("pages")({
			doc: { id: "page", slug: "new-draft", _status: "draft" },
			req,
		} as never)
		expect(findByID).toHaveBeenCalledWith(
			expect.objectContaining({ draft: false, req, collection: "pages" })
		)
		expect(queue).toHaveBeenCalledWith(
			expect.objectContaining({
				req,
				input: { collection: "pages", slugs: ["new-draft", "old-live"] },
			})
		)
	})

	it("captures native visibility before deletion and never trusts a private deleted snapshot", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T12:00:00.000Z")
		const findByID = vi
			.fn()
			.mockResolvedValue({ id: "tag", slug: "legacy-tag", updatedAt: "1", _status: "published" })
		const queue = vi.fn().mockResolvedValue({ id: "job" })
		const req = { context: {}, payload: { findByID, jobs: { queue } } }
		await capturePublicDeleteSnapshot("categories")({ id: "tag", req } as never)
		await createRevalidationDeleteHook("categories")({
			doc: { id: "tag", slug: "legacy-tag" },
			req,
		} as never)
		expect(queue).toHaveBeenCalledOnce()
		findByID.mockResolvedValue(null)
		await capturePublicDeleteSnapshot("categories")({ id: "private-tag", req } as never)
		await createRevalidationDeleteHook("categories")({
			doc: { id: "private-tag", _status: "published" },
			req,
		} as never)
		expect(queue).toHaveBeenCalledOnce()
	})
	it("fails the write when the public snapshot cannot be read", async () => {
		const findByID = vi.fn().mockRejectedValue(new Error("Database unavailable"))
		const req = { context: {}, payload: { findByID } }
		await expect(
			capturePublicSnapshot("posts")({
				originalDoc: { id: "post-1" },
				req,
			} as never)
		).rejects.toThrow("Database unavailable")
	})

	it("allows an absent public snapshot for a new draft", async () => {
		const findByID = vi.fn().mockResolvedValue(null)
		const queue = vi.fn()
		const req = { context: {}, payload: { findByID, jobs: { queue } } }
		const doc = { id: "post-1", _status: "draft" }
		await createRevalidationHook("posts")({ doc, req } as never)
		expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ disableErrors: true }))
		expect(queue).not.toHaveBeenCalled()
	})

	it("invalidates publish, unpublish, and published edits", () => {
		expect(
			shouldRevalidatePublicChange(
				{ status: "draft", updatedAt: "1" },
				{ status: "published", updatedAt: "2" }
			)
		).toBe(true)
		expect(
			shouldRevalidatePublicChange(
				{ status: "published", updatedAt: "1" },
				{ status: "draft", updatedAt: "2" }
			)
		).toBe(true)
		expect(
			shouldRevalidatePublicChange(
				{ status: "published", updatedAt: "1" },
				{ status: "published", updatedAt: "2" }
			)
		).toBe(true)
	})

	it("does not invalidate public data for draft-only edits", () => {
		expect(
			shouldRevalidatePublicChange(
				{ status: "published", updatedAt: "1" },
				{ status: "published", updatedAt: "1" }
			)
		).toBe(false)
		expect(
			shouldRevalidatePublicChange(
				{ status: "draft", updatedAt: "1" },
				{ status: "draft", updatedAt: "2" }
			)
		).toBe(false)
	})

	it("reads the public snapshot in the write request before a change", async () => {
		const findByID = vi.fn(async () => ({ _status: "draft", updatedAt: "1" }))
		const req = { context: {}, payload: { findByID } }

		await capturePublicSnapshot("posts")({ originalDoc: { id: "post-1" }, req } as never)

		expect(findByID).toHaveBeenCalledWith(
			expect.objectContaining({ collection: "posts", id: "post-1", draft: false, req })
		)
	})

	it("invalidates a newly published document using the snapshot visible in its transaction", async () => {
		let currentStatus = "draft"
		const findByID = vi.fn(async ({ req: readReq }: { req?: unknown }) => ({
			_status: readReq === req ? currentStatus : "draft",
			updatedAt: readReq === req ? "2" : "1",
		}))
		const queue = vi.fn(async () => ({ id: "job-1" }))
		const req = { context: {}, payload: { findByID, jobs: { queue } } }

		await capturePublicSnapshot("posts")({ originalDoc: { id: "post-1" }, req } as never)
		currentStatus = "published"
		const doc = { id: "post-1", slug: "new-slug", _status: "published" }
		await createRevalidationHook("posts")({ doc, previousDoc: { slug: "old-slug" }, req } as never)

		expect(findByID).toHaveBeenCalledTimes(2)
		expect(queue).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { collection: "posts", slugs: ["new-slug", "old-slug"] },
			})
		)
		expect(findByID).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ collection: "posts", id: "post-1", draft: false, req })
		)
	})

	it("invalidates the old live slug when the previous document is a newer draft", async () => {
		let publicSnapshot = { _status: "published", updatedAt: "1", slug: "old-live-slug" }
		const findByID = vi.fn(async () => publicSnapshot)
		const queue = vi.fn(async () => ({ id: "job-2" }))
		const req = { context: {}, payload: { findByID, jobs: { queue } } }

		await capturePublicSnapshot("pages")({ originalDoc: { id: "page-1" }, req } as never)
		publicSnapshot = { _status: "published", updatedAt: "2", slug: "new-live-slug" }
		await createRevalidationHook("pages")({
			doc: { id: "page-1", slug: "new-live-slug", _status: "published" },
			previousDoc: { slug: "newer-draft-slug" },
			req,
		} as never)

		expect(queue).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					collection: "pages",
					slugs: ["new-live-slug", "newer-draft-slug", "old-live-slug"],
				},
			})
		)
	})

	it("queues publication invalidation in the write transaction without calling the website", async () => {
		let currentStatus = "draft"
		const findByID = vi.fn(async () => ({
			_status: currentStatus,
			updatedAt: currentStatus === "draft" ? "1" : "2",
			slug: "published-slug",
		}))
		const queue = vi.fn(async () => ({ id: "job-1" }))
		const req = { context: {}, payload: { findByID, jobs: { queue } } }
		const fetchMock = vi.fn(async () => ({ ok: true }))
		vi.stubEnv("WWW_INTERNAL_SECRET", "1")
		vi.stubGlobal("fetch", fetchMock)

		await capturePublicSnapshot("posts")({ originalDoc: { id: "post-1" }, req } as never)
		currentStatus = "published"
		await createRevalidationHook("posts")({
			doc: { id: "post-1", slug: "published-slug", _status: "published" },
			previousDoc: { slug: "draft-slug" },
			req,
		} as never)

		expect(queue).toHaveBeenCalledWith(
			expect.objectContaining({
				req,
				queue: "www-revalidation",
				task: "revalidateWww",
				input: { collection: "posts", slugs: ["published-slug", "draft-slug"] },
			})
		)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it("queues published deletes and global changes with the write request", async () => {
		const queue = vi.fn(async () => ({ id: "job-3" }))
		const req = { payload: { jobs: { queue } } }

		await createRevalidationDeleteHook("posts")({
			doc: { id: "post-1", slug: "old-live", _status: "published" },
			req,
		} as never)
		await createGlobalRevalidationHook("site-config")({ doc: {}, req } as never)

		expect(queue).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ req, input: { collection: "posts", slugs: ["old-live"] } })
		)
		expect(queue).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ req, input: { collection: "site-config", slugs: [] } })
		)
	})

	it("propagates an enqueue failure so Payload can roll back the content write", async () => {
		const queue = vi.fn(async () => {
			throw new Error("Job storage unavailable")
		})
		const req = { payload: { jobs: { queue } } }

		await expect(
			createRevalidationDeleteHook("posts")({
				doc: { id: "post-1", slug: "old-live", _status: "published" },
				req,
			} as never)
		).rejects.toThrow("Job storage unavailable")
	})
})

describe("queued locale and shared-field invalidation", () => {
	function makeRequest(locale: unknown = "en") {
		const queue = vi.fn().mockResolvedValue({ id: "job" })
		const findByID = vi
			.fn()
			.mockResolvedValue({ _status: "published", slug: "example", updatedAt: "2" })
		return {
			locale,
			context: {
				publicRevalidationSnapshots: {
					"posts:post": { status: "published", slug: "example", updatedAt: "1" },
				},
			},
			payload: { findByID, jobs: { queue } },
		}
	}
	function jobInput(req: ReturnType<typeof makeRequest>) {
		return req.payload.jobs.queue.mock.calls.at(-1)?.[0].input
	}
	it("preserves a supported locale through a published content edit", async () => {
		const req = makeRequest("zh-CN")
		await createRevalidationHook("posts")({
			doc: { id: "post", slug: "example", _status: "published" },
			previousDoc: { _status: "published" },
			req,
		} as never)
		expect(jobInput(req)).toEqual({ collection: "posts", slugs: ["example"], locales: ["zh-CN"] })
	})
	it.each(["all", "unsupported", undefined])("falls back to all locales for %s", async (locale) => {
		const req = makeRequest(locale)
		req.locale = locale
		await createRevalidationHook("posts")({
			doc: { id: "post", slug: "example", _status: "published" },
			req,
		} as never)
		expect(jobInput(req)).toEqual({ collection: "posts", slugs: ["example"] })
	})
	it.each([true, false])(
		"refreshes every locale when commentsEnabled becomes %s",
		async (enabled) => {
			const req = makeRequest()
			await createRevalidationHook("posts", ["commentsEnabled"])({
				doc: { id: "post", slug: "example", _status: "published", commentsEnabled: enabled },
				previousDoc: { _status: "published", commentsEnabled: !enabled },
				req,
			} as never)
			expect(jobInput(req)).toEqual({ collection: "posts", slugs: ["example"] })
		}
	)
	it("refreshes every locale when publishing an autosaved comments change", async () => {
		const req = makeRequest()
		await createRevalidationHook("posts", ["commentsEnabled"])({
			doc: { id: "post", slug: "example", _status: "published", commentsEnabled: false },
			previousDoc: { _status: "draft", commentsEnabled: false },
			req,
		} as never)
		expect(jobInput(req)).toEqual({ collection: "posts", slugs: ["example"] })
	})
	it.each(["draft", "published"])("refreshes every locale for transition to %s", async (status) => {
		const req = makeRequest()
		req.context.publicRevalidationSnapshots["posts:post"].status =
			status === "draft" ? "published" : "draft"
		req.payload.findByID.mockResolvedValue({ _status: status, slug: "example", updatedAt: "2" })
		await createRevalidationHook("posts")({
			doc: { id: "post", slug: "example", _status: status },
			req,
		} as never)
		expect(jobInput(req)).toEqual({ collection: "posts", slugs: ["example"] })
	})
	it.each(["enabled", "repo", "repoId", "category", "categoryId"])(
		"refreshes every locale when Giscus %s changes",
		async (field) => {
			const req = makeRequest("zh-CN")
			await createGlobalRevalidationHook("site-config", ["giscus"])({
				doc: { giscus: { [field]: "new-value" } },
				previousDoc: { giscus: { [field]: "old-value" } },
				req,
			} as never)
			expect(jobInput(req)).toEqual({ collection: "site-config", slugs: [] })
		}
	)
	it("scopes a global edit when shared settings stay unchanged", async () => {
		const req = makeRequest()
		await createGlobalRevalidationHook("site-config", ["giscus"])({
			doc: { siteName: "New title", giscus: { enabled: true } },
			previousDoc: { siteName: "Old title", giscus: { enabled: true } },
			req,
		} as never)
		expect(jobInput(req)).toEqual({ collection: "site-config", slugs: [], locales: ["en"] })
	})
})
