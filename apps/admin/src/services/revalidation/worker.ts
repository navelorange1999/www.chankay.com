import type { Payload } from "payload"

import { REVALIDATION_JOB_QUEUE, REVALIDATION_TASK } from "./constants"

type RevalidationJob = {
	id: string
	queue?: string
	taskSlug?: string
	completedAt?: string | null
	hasError?: boolean | null
	processing?: boolean | null
	updatedAt?: string | null
}

// Longer than the callback's 60-second execution limit and website request timeout.
const ABANDONED_JOB_AFTER_MS = 300_000

async function readJob(payload: Payload, jobId: string): Promise<RevalidationJob | null> {
	try {
		return (await payload.findByID({
			collection: "payload-jobs" as never,
			id: jobId,
			depth: 0,
			overrideAccess: true,
		})) as RevalidationJob
	} catch {
		return null
	}
}

export async function processCommittedRevalidationJob(
	payload: Payload,
	jobId: string
): Promise<void> {
	const job = await readJob(payload, jobId)
	if (!job) {
		throw new Error("Revalidation job is not committed yet")
	}
	if (job.queue !== REVALIDATION_JOB_QUEUE || job.taskSlug !== REVALIDATION_TASK) {
		throw new Error("Invalid revalidation job")
	}
	if (job.completedAt) return
	if (job.hasError) {
		throw new Error("Revalidation job exhausted its retries")
	}
	if (job.processing) {
		const updatedAt = job.updatedAt ? Date.parse(job.updatedAt) : NaN
		if (!Number.isFinite(updatedAt) || Date.now() - updatedAt < ABANDONED_JOB_AFTER_MS) {
			throw new Error("Revalidation job is still processing")
		}
		// Keep the predicate on the write to avoid clearing a renewed or completed claim.
		// Omitting limit avoids the Mongo adapter's separate ID-selection query.
		await payload.db.updateJobs({
			where: {
				and: [
					{ id: { equals: jobId } },
					{ queue: { equals: REVALIDATION_JOB_QUEUE } },
					{ taskSlug: { equals: REVALIDATION_TASK } },
					{ processing: { equals: true } },
					{ completedAt: { exists: false } },
					{ hasError: { not_equals: true } },
					{ updatedAt: { equals: job.updatedAt } },
				],
			},
			data: { processing: false, updatedAt: new Date().toISOString() },
			returning: false,
		})
	}

	await payload.jobs.run({
		queue: REVALIDATION_JOB_QUEUE,
		limit: 1,
		where: { id: { equals: jobId } },
	})

	const updatedJob = await readJob(payload, jobId)
	if (!updatedJob?.completedAt) {
		throw new Error("Revalidation job remains pending")
	}
}
