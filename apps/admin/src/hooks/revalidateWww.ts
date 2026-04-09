import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from "payload"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

function resolveSiteUrl(): string {
	const envSiteUrl = process.env.WWW_SITE_URL?.trim()
	return (envSiteUrl || "https://www.chankay.com").replace(/\/+$/, "")
}

async function triggerRevalidation(collection: string, slugs: string[]) {
	const siteUrl = resolveSiteUrl()
	const secret = process.env.WWW_INTERNAL_SECRET?.trim()

	if (!secret) {
		return
	}

	const response = await fetch(new URL("/api/revalidate", siteUrl), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			[WWW_INTERNAL_SECRET_HEADER]: secret,
		},
		body: JSON.stringify({ collection, slugs }),
	})

	if (!response.ok) {
		throw new Error(`Frontend revalidation failed (${response.status})`)
	}
}

export function createRevalidationHook(collection: string): CollectionAfterChangeHook {
	return async ({ doc, previousDoc }) => {
		// Only revalidate when the document is published (skip draft autosaves)
		if (doc._status && doc._status !== "published") return doc

		const slugs = [doc?.slug, previousDoc?.slug]
			.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
			.filter((s, i, arr) => arr.indexOf(s) === i)

		try {
			await triggerRevalidation(collection, slugs)
		} catch {
			// Best effort only.
		}

		return doc
	}
}

export function createGlobalRevalidationHook(globalSlug: string): GlobalAfterChangeHook {
	return async ({ doc }) => {
		try {
			await triggerRevalidation(globalSlug, [])
		} catch {
			// Best effort only.
		}

		return doc
	}
}
