import type { CollectionConfig } from "payload"

import { DEFAULT_WAIT_FOR_MS } from "@/services/pageAssets/constants"
import { mediaCaptureBeforeOperation, validateCaptureUrl } from "@/services/mediaCapture"
import {
	buildBlobFileUrl,
	buildPayloadMediaFileUrl,
	normalizeStoredFilename,
} from "@/utils/mediaStorage"

type MediaDocLike = {
	filename?: string | null
	prefix?: string | null
	url?: string | null
	sizes?: Record<string, { filename?: string | null } | null> | null
}

export const Media: CollectionConfig = {
	slug: "media",
	access: {
		read: () => true,
	},

	typescript: {
		interface: "MediaInterface",
	},
	fields: [
		{
			name: "alt",
			type: "text",
			required: true,
			admin: {
				description: "Accessible description for the uploaded or generated image.",
			},
		},
		{
			name: "captureUrl",
			type: "text",
			label: "Capture URL",
			admin: {
				description:
					"Optional. Leave file upload empty and save to generate an image from this HTTPS URL via Browserless.",
				placeholder: "https://example.com",
			},
			validate: validateCaptureUrl,
		},
		{
			name: "captureWaitForMs",
			type: "number",
			label: "Capture Wait (ms)",
			defaultValue: DEFAULT_WAIT_FOR_MS,
			min: 0,
			admin: {
				condition: (_, siblingData) =>
					typeof siblingData?.captureUrl === "string" && siblingData.captureUrl.trim().length > 0,
				description: "Milliseconds to wait before Browserless captures the page.",
			},
		},
		{
			name: "width",
			type: "number",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "height",
			type: "number",
			admin: {
				readOnly: true,
			},
		},
	],
	hooks: {
		beforeOperation: [mediaCaptureBeforeOperation],
		afterDelete: [
			({ doc }) => {
				const mediaDoc = doc as MediaDocLike
				mediaDoc.filename =
					normalizeStoredFilename(mediaDoc.filename, mediaDoc.prefix) || mediaDoc.filename

				if (mediaDoc.sizes && typeof mediaDoc.sizes === "object") {
					for (const size of Object.values(mediaDoc.sizes)) {
						if (!size || typeof size !== "object") {
							continue
						}

						size.filename = normalizeStoredFilename(size.filename, mediaDoc.prefix) || size.filename
					}
				}

				return doc
			},
		],
	},
	upload: {
		// because we are using vercel blob storage, we need to disable local storage
		disableLocalStorage: true,
		filesRequiredOnCreate: false,

		adminThumbnail: ({ doc }) => {
			const mediaDoc = doc as MediaDocLike

			return (
				buildBlobFileUrl({
					baseUrl: process.env.VERCEL_BLOB_PUBLIC_BASE_URL,
					filename: mediaDoc.filename,
					prefix: mediaDoc.prefix,
				}) ||
				buildPayloadMediaFileUrl({
					apiBaseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
					collectionSlug: "media",
					filename: mediaDoc.filename,
					prefix: mediaDoc.prefix,
				}) ||
				mediaDoc.url ||
				null
			)
		},
	},
}
