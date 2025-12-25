declare namespace NodeJS {
	interface ProcessEnv {
		readonly PAYLOAD_API_URL: string
		readonly PAYLOAD_REVALIDATE_TIME: string
	}
}
