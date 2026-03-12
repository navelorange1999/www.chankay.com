import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload"

export type PageAssetsRequest = Parameters<CollectionAfterChangeHook>[0]["req"]
export type PayloadLike = Payload

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

export type PageAssetsRuntime = {
	context?: Record<string, unknown>
	logger: LoggerLike
	payload: PayloadLike
	request?: PayloadRequest
}
