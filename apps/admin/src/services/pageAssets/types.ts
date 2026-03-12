import type { CollectionAfterChangeHook } from "payload"

export type PageAssetsRequest = Parameters<CollectionAfterChangeHook>[0]["req"]

export type GenericDoc = {
	id: string
	title?: string | null
	slug?: string | null
	status?: string | null
	structure?: unknown
	seo?: unknown
}

export type GenericBlock = Record<string, unknown>

export type GeneratedImage = {
	buffer: Buffer
	contentType: string
	height: number
	width: number
}

export type MaybeDoc = GenericDoc & Record<string, unknown>

export type LoggerLike = {
	info: (message: string) => void
	warn?: (message: string) => void
	error?: (message: string) => void
}
