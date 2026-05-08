import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { isSupportedLocale, SUPPORTED_LOCALES, type SupportedLocale } from "@repo/i18n"

type LocaleLayoutParams = { locale: string }

export function generateStaticParams(): LocaleLayoutParams[] {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<LocaleLayoutParams>
}) {
	const { locale } = await params
	if (!isSupportedLocale(locale)) {
		notFound()
	}

	void (locale satisfies SupportedLocale)
	return children
}
