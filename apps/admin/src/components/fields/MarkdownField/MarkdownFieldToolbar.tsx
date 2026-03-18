"use client"

import type { MarkdownMode } from "./MarkdownField.types"

const activeButtonClass =
	"border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
const inactiveButtonClass =
	"border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"

export interface MarkdownFieldToolbarProps {
	mode: MarkdownMode
	onModeChange: (mode: MarkdownMode) => void
	onOpenMediaPicker: () => void
}

export function MarkdownFieldToolbar(props: MarkdownFieldToolbarProps) {
	const { mode, onModeChange, onOpenMediaPicker } = props

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				className={`rounded border px-3 py-1 text-sm ${
					mode === "write" ? activeButtonClass : inactiveButtonClass
				}`}
				onClick={() => onModeChange("write")}
			>
				Write
			</button>
			<button
				type="button"
				className={`rounded border px-3 py-1 text-sm ${
					mode === "preview" ? activeButtonClass : inactiveButtonClass
				}`}
				onClick={() => onModeChange("preview")}
			>
				Preview
			</button>
			<button
				type="button"
				className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
				onClick={onOpenMediaPicker}
			>
				Insert Media
			</button>
		</div>
	)
}
