import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"
import type { Plugin } from "payload"

import { payloadMcpPlugin } from "@/plugins/mcp"
import { buildBlobFileUrl, buildPayloadMediaFileUrl } from "@/utils/mediaStorage"

export const plugins: Plugin[] = [
	payloadMcpPlugin,
	/**
	 * https://payloadcms.com/docs/upload/storage-adapters#vercel-blob-storage
	 * https://vercel.com/docs/vercel-blob
	 */
	vercelBlobStorage({
		enabled: true, // Optional, defaults to true
		alwaysInsertFields: true,
		addRandomSuffix: true,
		// Specify which collections should use Vercel Blob
		collections: {
			media: {
				generateFileURL: ({ collection, filename, prefix }) =>
					buildBlobFileUrl({
						baseUrl: process.env.VERCEL_BLOB_PUBLIC_BASE_URL,
						filename,
						prefix,
					}) ||
					buildPayloadMediaFileUrl({
						apiBaseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
						collectionSlug: collection.slug,
						filename,
						prefix,
					}) ||
					"",
				prefix: "media",
			},
		},
		// Token provided by Vercel once Blob storage is added to your Vercel project
		token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
	}),
]
