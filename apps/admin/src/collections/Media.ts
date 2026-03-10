import type { CollectionConfig } from "payload"

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
		},
		{
			name: "width",
			type: "number",
			required: true,
		},
		{ name: "height", type: "number", required: true },
	],
	hooks: {
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
