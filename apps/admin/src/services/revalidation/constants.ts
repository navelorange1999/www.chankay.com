import { isSupportedLocale, type SupportedLocale } from "@repo/i18n"

export const REVALIDATION_TASK = "revalidateWww"
export const REVALIDATION_JOB_QUEUE = "www-revalidation"
export const REVALIDATION_WAKEUP_TOPIC = "www-revalidation"

export const REVALIDATION_COLLECTIONS = [
	"posts",
	"pages",
	"categories",
	"series",
	"media",
	"site-config",
] as const

export type RevalidationCollection = (typeof REVALIDATION_COLLECTIONS)[number]

export type RevalidationInput = {
	collection: RevalidationCollection
	slugs: string[]
	locales?: SupportedLocale[]
}

export function isRevalidationCollection(value: unknown): value is RevalidationCollection {
	return (
		typeof value === "string" && REVALIDATION_COLLECTIONS.some((collection) => collection === value)
	)
}

export function normalizeRevalidationSlugs(values: unknown): string[] {
	if (!Array.isArray(values) || values.length > 20) {
		throw new Error("Invalid revalidation slugs")
	}
	const slugs = values.map((value) => {
		if (typeof value !== "string" || value.length > 512) {
			throw new Error("Invalid revalidation slug")
		}
		return value.trim()
	})
	return [...new Set(slugs.filter(Boolean))]
}

export function normalizeRevalidationLocales(values: unknown): SupportedLocale[] | undefined {
	if (values === undefined) return undefined
	if (
		!Array.isArray(values) ||
		values.length === 0 ||
		values.length > 20 ||
		!values.every(isSupportedLocale)
	) {
		throw new Error("Invalid revalidation locales")
	}
	return [...new Set(values)]
}
