"use client"

import { useParams } from "next/navigation"

import { DEFAULT_LOCALE, getUiStrings, isSupportedLocale } from "@repo/i18n"

import { BackgroundBeamsClient } from "@/components/lazy/BackgroundBeamsClient"

export function LocalizedNotFound() {
	const params = useParams<{ locale?: string }>()
	const locale = isSupportedLocale(params?.locale) ? params.locale : DEFAULT_LOCALE
	const strings = getUiStrings(locale).notFound

	return (
		<div className="relative flex min-h-[calc(100dvh-var(--navbar-height,4rem))] w-full items-center justify-center overflow-hidden bg-background">
			<BackgroundBeamsClient />
			<div className="relative z-10 px-4 text-center">
				<h1 className="mb-4 text-4xl font-bold md:text-6xl">{strings.title}</h1>
				<p className="max-w-2xl text-lg md:text-xl">{strings.description}</p>
			</div>
		</div>
	)
}
