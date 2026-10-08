import { describe, expect, it, vi } from "vitest"

import { processCommittedRevalidationJob } from "../worker"

const jobId = "0123456789abcdef01234567"

describe("committed revalidation worker", () => {
	it("waits for a committed job before making any delivery attempt", async () => {
		const findByID = vi.fn(async () => {
			throw new Error("Not found")
		})
		const run = vi.fn()

		await expect(
			processCommittedRevalidationJob({ findByID, jobs: { run } } as never, jobId)
		).rejects.toThrow("not committed yet")
		expect(run).not.toHaveBeenCalled()
	})

	it("rejects a job outside the revalidation queue", async () => {
		const findByID = vi.fn(async () => ({
			id: jobId,
			queue: "page-assets",
			taskSlug: "otherTask",
		}))
		const run = vi.fn()

		await expect(
			processCommittedRevalidationJob({ findByID, jobs: { run } } as never, jobId)
		).rejects.toThrow("Invalid revalidation job")
		expect(run).not.toHaveBeenCalled()
	})

	it("claims only the committed job and skips duplicate delivery", async () => {
		const job = {
			id: jobId,
			queue: "www-revalidation",
			taskSlug: "revalidateWww",
			completedAt: null as string | null,
		}
		const findByID = vi.fn(async () => job)
		const run = vi.fn(async () => {
			job.completedAt = "2026-10-08T00:00:00.000Z"
		})
		const payload = { findByID, jobs: { run } } as never

		await processCommittedRevalidationJob(payload, jobId)
		await processCommittedRevalidationJob(payload, jobId)

		expect(run).toHaveBeenCalledOnce()
		expect(run).toHaveBeenCalledWith({
			queue: "www-revalidation",
			limit: 1,
			where: { id: { equals: jobId } },
		})
	})

	it("requests another callback when notification remains pending", async () => {
		const job = { id: jobId, queue: "www-revalidation", taskSlug: "revalidateWww" }
		const findByID = vi.fn(async () => job)
		const run = vi.fn(async () => ({ jobStatus: { [jobId]: { status: "error" } } }))

		await expect(
			processCommittedRevalidationJob({ findByID, jobs: { run } } as never, jobId)
		).rejects.toThrow("remains pending")
	})

	it("recovers a processing job abandoned by a terminated callback", async () => {
		const updatedAt = new Date(Date.now() - 600_000).toISOString()
		const job = {
			id: jobId,
			queue: "www-revalidation",
			taskSlug: "revalidateWww",
			processing: true,
			updatedAt,
			completedAt: null as string | null,
		}
		const findByID = vi.fn(async () => job)
		const updateJobs = vi.fn(async () => {
			job.processing = false
		})
		const run = vi.fn(async () => {
			if (!job.processing) job.completedAt = new Date().toISOString()
		})

		await processCommittedRevalidationJob(
			{ findByID, db: { updateJobs }, jobs: { run } } as never,
			jobId
		)

		expect(updateJobs).toHaveBeenCalledWith(
			expect.objectContaining({
				returning: false,
				where: {
					and: [
						{ id: { equals: jobId } },
						{ queue: { equals: "www-revalidation" } },
						{ taskSlug: { equals: "revalidateWww" } },
						{ processing: { equals: true } },
						{ completedAt: { exists: false } },
						{ hasError: { not_equals: true } },
						{ updatedAt: { equals: updatedAt } },
					],
				},
				data: { processing: false, updatedAt: expect.any(String) },
			})
		)
		expect(run).toHaveBeenCalledOnce()
	})

	it("does not reset a callback that is still running", async () => {
		const job = {
			id: jobId,
			queue: "www-revalidation",
			taskSlug: "revalidateWww",
			processing: true,
			updatedAt: new Date().toISOString(),
		}
		const updateJobs = vi.fn()
		const run = vi.fn()
		await expect(
			processCommittedRevalidationJob(
				{
					findByID: async () => job,
					db: { updateJobs },
					jobs: { run },
				} as never,
				jobId
			)
		).rejects.toThrow("still processing")
		expect(updateJobs).not.toHaveBeenCalled()
		expect(run).not.toHaveBeenCalled()
	})
})
