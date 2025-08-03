import {vercelBlobStorage} from "@payloadcms/storage-vercel-blob";
import {Plugin} from "payload";

export const plugins: Plugin[] = [
	/**
	 * https://payloadcms.com/docs/upload/storage-adapters#vercel-blob-storage
	 * https://vercel.com/docs/vercel-blob
	 */
	vercelBlobStorage({
		enabled: true, // Optional, defaults to true
		// Specify which collections should use Vercel Blob
		collections: {
			media: {
				prefix: "www-",
			},
		},
		// Token provided by Vercel once Blob storage is added to your Vercel project
		token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
	}),
];
