"use client"

import { useState } from "react"

import type { MediaDoc } from "./MarkdownField.types"
import { deriveAltFromFilename, getString } from "./MarkdownField.utils"

export interface MarkdownFieldMediaPickerProps {
	filteredMedia: MediaDoc[]
	isLoadingMedia: boolean
	isUploadingMedia: boolean
	mediaError: string
	mediaQuery: string
	onClose: () => void
	onInsertMedia: (media: MediaDoc) => void
	onMediaQueryChange: (value: string) => void
	onUploadMedia: (args: { alt: string; file: File }) => Promise<void>
}

export function MarkdownFieldMediaPicker(props: MarkdownFieldMediaPickerProps) {
	const {
		filteredMedia,
		isLoadingMedia,
		isUploadingMedia,
		mediaError,
		mediaQuery,
		onClose,
		onInsertMedia,
		onMediaQueryChange,
		onUploadMedia,
	} = props
	const [fileInputKey, setFileInputKey] = useState(0)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploadAlt, setUploadAlt] = useState("")
	const [uploadError, setUploadError] = useState("")

	async function handleUploadMedia() {
		if (!selectedFile) {
			setUploadError("Select a file before uploading.")
			return
		}

		const normalizedAlt = uploadAlt.trim()

		if (!normalizedAlt) {
			setUploadError("Provide alt text before uploading.")
			return
		}

		setUploadError("")

		try {
			await onUploadMedia({
				alt: normalizedAlt,
				file: selectedFile,
			})

			setSelectedFile(null)
			setUploadAlt("")
			setFileInputKey((currentValue) => currentValue + 1)
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Failed to upload media")
		}
	}

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
			<div className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-950">
				<div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
					<div>
						<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
							Select Media
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Insert media as Markdown image: <code>![alt](url)</code>
						</p>
					</div>
					<button
						type="button"
						className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
						onClick={onClose}
					>
						Close
					</button>
				</div>

				<div className="border-b border-gray-200 px-5 py-3 dark:border-gray-800">
					<div className="mb-4 grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
						<div className="space-y-1">
							<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
								Upload New Media
							</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Upload a file here, then insert it as a Markdown image.
							</p>
						</div>

						<input
							key={fileInputKey}
							type="file"
							onChange={(event) => {
								const nextFile = event.target.files?.[0] || null
								setSelectedFile(nextFile)

								if (nextFile && !uploadAlt.trim()) {
									setUploadAlt(deriveAltFromFilename(nextFile.name))
								}
							}}
							className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 dark:text-gray-200 dark:file:bg-blue-950 dark:file:text-blue-200"
						/>

						<input
							type="text"
							value={uploadAlt}
							onChange={(event) => setUploadAlt(event.target.value)}
							placeholder="Describe the image for alt text"
							className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						/>

						<div className="flex items-center justify-between gap-3">
							<p className="min-h-5 text-sm text-gray-500 dark:text-gray-400">
								{selectedFile ? `Selected: ${getString(selectedFile.name)}` : "No file selected"}
							</p>
							<button
								type="button"
								className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
								onClick={() => void handleUploadMedia()}
								disabled={isUploadingMedia}
							>
								{isUploadingMedia ? "Uploading..." : "Upload"}
							</button>
						</div>

						{uploadError ? (
							<p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
						) : null}
					</div>

					<input
						type="text"
						value={mediaQuery}
						onChange={(event) => onMediaQueryChange(event.target.value)}
						placeholder="Filter media by alt text, filename, or URL"
						className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
					/>
				</div>

				<div className="overflow-y-auto p-5">
					{isLoadingMedia || isUploadingMedia ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">Loading media...</p>
					) : null}

					{mediaError ? (
						<p className="text-sm text-red-600 dark:text-red-400">{mediaError}</p>
					) : null}

					{!isLoadingMedia && !mediaError && filteredMedia.length === 0 ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							No media found for the current filter.
						</p>
					) : null}

					{filteredMedia.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filteredMedia.map((media) => {
								const previewUrl = media.thumbnailURL || media.url
								const label = media.alt || media.filename || "media"

								return (
									<div
										key={media.id}
										className="flex h-full flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
									>
										{previewUrl ? (
											<div className="flex h-36 items-center justify-center overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
												{media.mimeType?.startsWith("image/") ? (
													<img
														src={previewUrl}
														alt={label}
														className="h-full w-full object-cover"
													/>
												) : (
													<a
														href={previewUrl}
														target="_blank"
														rel="noreferrer"
														className="px-3 text-sm text-blue-600 dark:text-blue-300"
													>
														Open file
													</a>
												)}
											</div>
										) : (
											<div className="flex h-36 items-center justify-center rounded bg-gray-100 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
												No preview available
											</div>
										)}

										<div className="space-y-1 text-sm">
											<p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
											{media.filename ? (
												<p className="break-all text-gray-500 dark:text-gray-400">
													{media.filename}
												</p>
											) : null}
										</div>

										<button
											type="button"
											className="mt-auto rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
											onClick={() => onInsertMedia(media)}
											disabled={!media.url}
										>
											Insert Image
										</button>
									</div>
								)
							})}
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}
