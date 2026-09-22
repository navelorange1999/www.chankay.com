import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
	GlobalAfterChangeHook,
} from "payload"

import { isSupportedLocale, type SupportedLocale } from "@repo/i18n"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

function resolveSiteUrl(): string {
	const envSiteUrl = process.env.WWW_SITE_URL?.trim()
	return (envSiteUrl || "https://www.chankay.com").replace(/\/+$/, "")
}

function resolveLocales(locale: unknown): SupportedLocale[] | undefined {
	return isSupportedLocale(locale) ? [locale] : undefined
}

async function triggerRevalidation(
	collection: string,
	slugs: string[],
	locales?: SupportedLocale[]
) {
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
		body: JSON.stringify({ collection, slugs, ...(locales ? { locales } : {}) }),
	})

	if (!response.ok) {
		throw new Error(`Frontend revalidation failed (${response.status})`)
	}
}

function sharedFieldsChanged(
	doc: Record<string, unknown>,
	previousDoc: Record<string, unknown> | undefined,
	fields: readonly string[]
): boolean {
	return fields.some((field) => JSON.stringify(doc[field]) !== JSON.stringify(previousDoc?.[field]))
}

export function createRevalidationHook(
	collection: string,
	sharedFields: readonly string[] = []
): CollectionAfterChangeHook {
	return async ({ doc, previousDoc, req }) => {
		// Only revalidate when the document is published (skip draft autosaves)
		if (doc._status && doc._status !== "published") return doc

		const slugs = [doc?.slug, previousDoc?.slug]
			.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
			.filter((s, i, arr) => arr.indexOf(s) === i)

		try {
			// The previous version can be an autosaved draft with the new shared values already set.
			const publishingDraft = sharedFields.length > 0 && previousDoc?._status === "draft"
			const locales =
				publishingDraft || sharedFieldsChanged(doc, previousDoc, sharedFields)
					? undefined
					: resolveLocales(req.locale)
			await triggerRevalidation(collection, slugs, locales)
		} catch {
			// Best effort only.
		}

		return doc
	}
}

export function createRevalidationDeleteHook(collection: string): CollectionAfterDeleteHook {
	return async () => {
		try {
			await triggerRevalidation(collection, [])
		} catch {
			// Best effort only.
		}
	}
}

export function createGlobalRevalidationHook(
	globalSlug: string,
	sharedFields: readonly string[] = []
): GlobalAfterChangeHook {
	return async ({ doc, previousDoc, req }) => {
		try {
			const locales = sharedFieldsChanged(doc, previousDoc, sharedFields)
				? undefined
				: resolveLocales(req.locale)
			await triggerRevalidation(globalSlug, [], locales)
		} catch {
			// Best effort only.
		}

		return doc
	}
}
