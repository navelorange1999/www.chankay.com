export type MediaDoc = {
	id: string
	alt?: string | null
	filename?: string | null
	mimeType?: string | null
	thumbnailURL?: string | null
	url?: string | null
}

export type MediaResponse = {
	docs?: MediaDoc[]
}

export type MarkdownFieldCustom = {
	mediaRelationTo?: string
}

export type MarkdownMode = "write" | "preview"

export type SelectionRange = {
	start: number
	end: number
}
