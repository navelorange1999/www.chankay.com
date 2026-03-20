"use client"

import { useEffect, useState } from "react"

import type { MediaDoc, MediaResponse } from "./MarkdownField.types"
import { getErrorMessageFromResponse } from "./MarkdownField.utils"

export function useMarkdownFieldMedia(args: {
	apiBase: string
	relationTo: string
	enabled: boolean
}) {
	const { apiBase, relationTo, enabled } = args

	const [isLoadingMedia, setIsLoadingMedia] = useState(false)
	const [mediaError, setMediaError] = useState("")
	const [mediaItems, setMediaItems] = useState<MediaDoc[]>([])
	const [mediaQuery, setMediaQuery] = useState("")
	const [isUploadingMedia, setIsUploadingMedia] = useState(false)
	const [mediaRequestKey, setMediaRequestKey] = useState(0)

	useEffect(() => {
		if (!enabled) return

		let isMounted = true

		async function loadMedia() {
			setIsLoadingMedia(true)
			setMediaError("")

			try {
				const response = await fetch(`${apiBase}/${relationTo}?depth=0&limit=24&sort=-updatedAt`, {
					credentials: "include",
				})

				if (!response.ok) {
					throw new Error(
						await getErrorMessageFromResponse(
							response,
							`Media request failed with ${response.status}`
						)
					)
				}

				const result = (await response.json()) as MediaResponse

				if (isMounted) {
					setMediaItems(Array.isArray(result.docs) ? result.docs : [])
				}
			} catch (error) {
				if (isMounted) {
					setMediaError(error instanceof Error ? error.message : "Failed to load media")
				}
			} finally {
				if (isMounted) {
					setIsLoadingMedia(false)
				}
			}
		}

		void loadMedia()

		return () => {
			isMounted = false
		}
	}, [apiBase, enabled, mediaRequestKey, relationTo])

	async function uploadMedia(args: { alt: string; file: File }) {
		const { alt, file } = args

		setIsUploadingMedia(true)
		setMediaError("")

		try {
			const formData = new FormData()
			formData.append("_payload", JSON.stringify({ alt }))
			formData.append("file", file)

			const response = await fetch(`${apiBase}/${relationTo}`, {
				body: formData,
				credentials: "include",
				method: "POST",
			})

			if (!response.ok) {
				throw new Error(
					await getErrorMessageFromResponse(response, `Media upload failed with ${response.status}`)
				)
			}

			setMediaRequestKey((currentValue) => currentValue + 1)
		} finally {
			setIsUploadingMedia(false)
		}
	}

	const filteredMedia = mediaItems.filter((media) => {
		if (!mediaQuery.trim()) return true

		const query = mediaQuery.trim().toLowerCase()
		const haystack = [media.alt, media.filename, media.url].filter(Boolean).join(" ").toLowerCase()
		return haystack.includes(query)
	})

	return {
		filteredMedia,
		isLoadingMedia,
		isUploadingMedia,
		mediaError,
		mediaItems,
		mediaQuery,
		setMediaQuery,
		uploadMedia,
	}
}
