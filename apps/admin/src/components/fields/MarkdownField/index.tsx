"use client"

import React, { useEffect, useRef, useState } from "react"
import { FieldLabel, useConfig, useField } from "@payloadcms/ui"

import { Markdown } from "@repo/ui"

import type { TextareaFieldClientComponent } from "payload"

import { MarkdownFieldMediaPicker } from "./MarkdownFieldMediaPicker"
import { MarkdownFieldToolbar } from "./MarkdownFieldToolbar"
import type { MarkdownMode, SelectionRange } from "./MarkdownField.types"
import { getMarkdownFieldCustom, getString, normalizeLabel } from "./MarkdownField.utils"
import { useMarkdownFieldMedia } from "./useMarkdownFieldMedia"

const MarkdownField: TextareaFieldClientComponent = ({ field, path }) => {
	const { value, setValue } = useField<string>({ path })
	const { config } = useConfig()

	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const selectionRef = useRef<SelectionRange>({
		end: 0,
		start: 0,
	})

	const [mode, setMode] = useState<MarkdownMode>("write")
	const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)

	const currentValue = getString(value)
	const custom = getMarkdownFieldCustom(field)
	const description = getString(field.admin?.description)
	const placeholder = getString(field.admin?.placeholder) || "Write Markdown..."
	const rows = typeof field.admin?.rows === "number" ? field.admin.rows : 18
	const mediaRelationTo = custom.mediaRelationTo || "media"
	const apiBase = typeof config?.routes?.api === "string" ? config.routes.api : "/api"
	const {
		filteredMedia,
		isLoadingMedia,
		isUploadingMedia,
		mediaError,
		mediaQuery,
		setMediaQuery,
		uploadMedia,
	} = useMarkdownFieldMedia({
		apiBase,
		enabled: isMediaPickerOpen,
		relationTo: mediaRelationTo,
	})

	useEffect(() => {
		selectionRef.current = {
			end: currentValue.length,
			start: currentValue.length,
		}
	}, [currentValue.length, path])

	function syncSelection() {
		const textarea = textareaRef.current
		if (!textarea) return

		selectionRef.current = {
			end: textarea.selectionEnd,
			start: textarea.selectionStart,
		}
	}

	function insertSnippet(snippet: string) {
		const { start, end } = selectionRef.current
		const nextValue = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`

		setValue(nextValue)
		setMode("write")
		setIsMediaPickerOpen(false)

		window.requestAnimationFrame(() => {
			const textarea = textareaRef.current
			if (!textarea) return

			const nextCursor = start + snippet.length
			textarea.focus()
			textarea.setSelectionRange(nextCursor, nextCursor)
			selectionRef.current = {
				end: nextCursor,
				start: nextCursor,
			}
		})
	}

	function handleInsertMedia(args: {
		alt?: string | null
		filename?: string | null
		url?: string | null
	}) {
		if (!args.url) return

		const label = normalizeLabel(args.alt?.trim() || args.filename?.trim() || "media")
		insertSnippet(`![${label}](${args.url})`)
	}

	return (
		<div className="mb-3 space-y-3">
			<FieldLabel label={field.label || field.name} path={path} required={field.required} />

			<MarkdownFieldToolbar
				mode={mode}
				onModeChange={setMode}
				onOpenMediaPicker={() => {
					syncSelection()
					setIsMediaPickerOpen(true)
				}}
			/>

			{description ? (
				<p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
			) : null}

			{mode === "write" ? (
				<textarea
					ref={textareaRef}
					value={currentValue}
					rows={rows}
					placeholder={placeholder}
					onChange={(event) => setValue(event.target.value)}
					onClick={syncSelection}
					onKeyUp={syncSelection}
					onSelect={syncSelection}
					className="w-full rounded border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
				/>
			) : (
				<div className="min-h-40 rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
					{currentValue.trim() ? (
						<Markdown content={currentValue} />
					) : (
						<p className="text-sm text-gray-500 dark:text-gray-400">Nothing to preview yet.</p>
					)}
				</div>
			)}

			{isMediaPickerOpen ? (
				<MarkdownFieldMediaPicker
					filteredMedia={filteredMedia}
					isLoadingMedia={isLoadingMedia}
					isUploadingMedia={isUploadingMedia}
					mediaError={mediaError}
					mediaQuery={mediaQuery}
					onClose={() => setIsMediaPickerOpen(false)}
					onInsertMedia={handleInsertMedia}
					onMediaQueryChange={setMediaQuery}
					onUploadMedia={uploadMedia}
				/>
			) : null}
		</div>
	)
}

export default MarkdownField
