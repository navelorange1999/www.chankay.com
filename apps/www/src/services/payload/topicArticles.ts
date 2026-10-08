import { isSafePostSlug, type SupportedLocale } from "@repo/i18n"

export type TopicArticlePage = {
	schemaVersion: 1
	locale: SupportedLocale
	generatedAt: string
	selection: { category: string; topic: string }
	page: number
	limit: 10
	totalDocs: number
	hasNextPage: boolean
	docs: Array<{ id: string; slug: string; title: string; excerpt?: string; publishedAt?: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isTopicArticlePage(
	value: unknown,
	expected: { locale: SupportedLocale; category: string; topic: string; page: number }
): value is TopicArticlePage {
	if (
		!isRecord(value) ||
		value.schemaVersion !== 1 ||
		value.locale !== expected.locale ||
		typeof value.generatedAt !== "string" ||
		!isRecord(value.selection) ||
		value.selection.category !== expected.category ||
		value.selection.topic !== expected.topic ||
		value.page !== expected.page ||
		value.limit !== 10 ||
		!Number.isSafeInteger(value.totalDocs) ||
		(value.totalDocs as number) < 0 ||
		typeof value.hasNextPage !== "boolean" ||
		!Array.isArray(value.docs) ||
		value.docs.length > 10
	)
		return false
	const seen = new Set<string>()
	for (const doc of value.docs) {
		if (
			!isRecord(doc) ||
			typeof doc.id !== "string" ||
			!doc.id ||
			seen.has(doc.id) ||
			typeof doc.slug !== "string" ||
			!isSafePostSlug(doc.slug) ||
			typeof doc.title !== "string" ||
			!doc.title ||
			(doc.excerpt !== undefined && typeof doc.excerpt !== "string") ||
			(doc.publishedAt !== undefined && typeof doc.publishedAt !== "string")
		)
			return false
		seen.add(doc.id)
	}
	const page = value.page as number
	const total = value.totalDocs as number
	return (
		value.docs.length <= Math.max(0, total - (page - 1) * 10) &&
		value.hasNextPage === page * 10 < total
	)
}
