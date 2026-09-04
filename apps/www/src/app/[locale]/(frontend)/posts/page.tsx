import { permanentRedirect } from "next/navigation"

import type { SupportedLocale } from "@repo/i18n"

import { resolvePostSectionPath } from "@/utils/postSections"

type LegacyPostsPageParams = { locale: SupportedLocale }

export default async function LegacyPostsPage({
	params,
}: {
	params: Promise<LegacyPostsPageParams>
}) {
	const { locale } = await params
	permanentRedirect(resolvePostSectionPath("technical", undefined, locale))
}
