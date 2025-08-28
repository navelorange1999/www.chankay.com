export class PayloadClient {
	private baseUrl: string

	constructor(baseUrl: string = process.env.PAYLOAD_API_URL || "http://localhost:3001") {
		this.baseUrl = baseUrl
	}

	async getGlobal<T>(slug: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}/globals/${slug}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: {
				revalidate: parseInt(process.env.PAYLOAD_REVALIDATE_TIME),
				tags: [`global:${slug}`],
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch global ${slug}`)
		}

		return response.json()
	}
}

export const payloadClient = new PayloadClient()
