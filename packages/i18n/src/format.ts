import type { SupportedLocale } from "./config.js"

export function formatLocalizedDate(
	value: string | Date | null | undefined,
	locale: SupportedLocale
): string | undefined {
	if (!value) return undefined

	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return undefined

	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date)
}

export function formatReadingTime(minutes: number, locale: SupportedLocale): string {
	if (locale === "zh-CN") {
		return `阅读 ${minutes} 分钟`
	}

	return `${minutes} min read`
}
