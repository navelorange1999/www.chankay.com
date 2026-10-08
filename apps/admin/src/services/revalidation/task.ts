import type { TaskConfig } from "payload"

import {
	isRevalidationCollection,
	normalizeRevalidationSlugs,
	normalizeRevalidationLocales,
	REVALIDATION_TASK,
} from "./constants"
import type { RevalidationInput } from "./constants"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

export async function sendWebsiteRevalidation(input: RevalidationInput): Promise<void> {
	if (!isRevalidationCollection(input.collection)) {
		throw new Error("Invalid revalidation collection")
	}
	const slugs = normalizeRevalidationSlugs(input.slugs)
	const locales = normalizeRevalidationLocales(input.locales)
	const secret = process.env.WWW_INTERNAL_SECRET?.trim()
	if (!secret) {
		throw new Error("Website revalidation is not configured")
	}
	const siteUrl = (process.env.WWW_SITE_URL?.trim() || "https://chankay.com").replace(
		/\/+$/,
		""
	)
	const response = await fetch(new URL("/api/revalidate", siteUrl), {
		method: "POST",
		signal: AbortSignal.timeout(20000),
		headers: {
			"Content-Type": "application/json",
			[WWW_INTERNAL_SECRET_HEADER]: secret,
		},
		body: JSON.stringify({ collection: input.collection, slugs, ...(locales ? { locales } : {}) }),
	})
	if (!response.ok) {
		throw new Error(`Frontend revalidation failed (${response.status})`)
	}
}

export const revalidateWwwTask: TaskConfig<{
	input: RevalidationInput
	output: { delivered: boolean }
}> = {
	slug: REVALIDATION_TASK,
	inputSchema: [
		{ name: "collection", type: "text", required: true },
		{ name: "slugs", type: "json", required: true },
		{ name: "locales", type: "json" },
	],
	outputSchema: [{ name: "delivered", type: "checkbox", required: true }],
	retries: { attempts: 6, backoff: { delay: 10000, type: "exponential" } },
	handler: async ({ input }) => {
		await sendWebsiteRevalidation(input)
		return { output: { delivered: true } }
	},
}
