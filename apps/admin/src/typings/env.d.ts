declare namespace NodeJS {
	interface ProcessEnv {
		readonly DATABASE_URI: string;
		readonly PAYLOAD_SECRET: string;
		readonly NEXT_PUBLIC_SERVER_URL: string;
		readonly VERCEL_BLOB_READ_WRITE_TOKEN: string;
		readonly VERCEL_BLOB_PUBLIC_BASE_URL: string;
	}
}
