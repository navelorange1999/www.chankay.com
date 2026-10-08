import { send } from "@vercel/queue"
import type { PayloadRequest } from "payload"

import {
	isRevalidationCollection,
	normalizeRevalidationSlugs,
	normalizeRevalidationLocales,
	REVALIDATION_JOB_QUEUE,
	REVALIDATION_TASK,
	REVALIDATION_WAKEUP_TOPIC,
} from "./constants"
import type { RevalidationCollection, RevalidationInput } from "./constants"

export async function enqueueRevalidation(
	req: PayloadRequest,
	collection: RevalidationCollection,
	slugs: unknown[],
	locales?: RevalidationInput["locales"]
): Promise<void> {
	if (!isRevalidationCollection(collection)) {
		throw new Error("Invalid revalidation collection")
	}
	const normalizedLocales = normalizeRevalidationLocales(locales)
	const input = {
		collection,
		slugs: normalizeRevalidationSlugs(slugs),
		...(normalizedLocales ? { locales: normalizedLocales } : {}),
	}
	const queueJob = req.payload.jobs.queue as (args: {
		task: string
		queue: string
		input: typeof input
		req: PayloadRequest
	}) => Promise<{ id: string | number }>
	const job = await queueJob({
		task: REVALIDATION_TASK,
		queue: REVALIDATION_JOB_QUEUE,
		input,
		req,
	})

	if (process.env.VERCEL?.trim()) {
		await send(
			REVALIDATION_WAKEUP_TOPIC,
			{ jobId: String(job.id) },
			{ delaySeconds: 5, idempotencyKey: String(job.id) }
		)
	}
}
