import type { Metadata } from "next"

import { getUiStrings } from "@repo/i18n"

import { LocalizedNotFound } from "@/components/LocalizedNotFound"

const fallbackStrings = getUiStrings("en").notFound

export const metadata: Metadata = {
	title: {
		absolute: `${fallbackStrings.title} | ChanKay Blog`,
	},
	description: fallbackStrings.description,
}

export default function NotFound() {
	return <LocalizedNotFound />
}
