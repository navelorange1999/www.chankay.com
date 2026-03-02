export interface PayloadQueryOptions {
	revalidate?: number
	tags?: string[]
	cache?: RequestCache
}

function resolvePayloadBaseUrl(): string {
	const configuredBaseUrl = process.env.PAYLOAD_API_URL?.trim()

	if (configuredBaseUrl) {
		return configuredBaseUrl
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"Missing PAYLOAD_API_URL in production. Set PAYLOAD_API_URL to a reachable Payload API endpoint (for example, https://admin.example.com/api)."
		)
	}

	return "http://localhost:3001/api"
}

export class PayloadClient {
	private baseUrl: string

	constructor(baseUrl: string = resolvePayloadBaseUrl()) {
		this.baseUrl = baseUrl
	}

	async getGlobal<T>(slug: string, options?: PayloadQueryOptions): Promise<T> {
		const response = await fetch(`${this.baseUrl}/globals/${slug}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: {
				revalidate: options?.revalidate ?? parseInt(process.env.PAYLOAD_REVALIDATE_TIME || "60"),
				tags: options?.tags ?? [`global:${slug}`],
			},
			cache: options?.cache,
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch global ${slug}`)
		}

		return response.json()
	}

	async getCollection<T>(
		collection: string,
		options?: PayloadQueryOptions & {
			where?: Record<string, unknown>
			depth?: number
			limit?: number
			page?: number
		}
	): Promise<{ docs: T[]; totalDocs: number; limit: number; page: number }> {
		const params = new URLSearchParams()

		if (options?.where) {
			Object.entries(options.where).forEach(([key, value]) => {
				if (typeof value === "object" && value !== null) {
					// Handle nested where conditions like { equals: "value" }
					Object.entries(value).forEach(([operator, val]) => {
						params.append(`where[${key}][${operator}]`, String(val))
					})
				} else {
					params.append(`where[${key}]`, String(value))
				}
			})
		}

		if (options?.depth !== undefined) params.append("depth", String(options.depth))
		if (options?.limit !== undefined) params.append("limit", String(options.limit))
		if (options?.page !== undefined) params.append("page", String(options.page))

		const url = `${this.baseUrl}/${collection}?${params.toString()}`

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: {
				revalidate: options?.revalidate ?? parseInt(process.env.PAYLOAD_REVALIDATE_TIME || "60"),
				tags: options?.tags ?? [`collection:${collection}`],
			},
			cache: options?.cache,
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch collection ${collection}`)
		}

		return response.json()
	}

	async getBySlug<T>(
		collection: string,
		slug: string,
		options?: PayloadQueryOptions & {
			depth?: number
			where?: Record<string, unknown>
		}
	): Promise<T | null> {
		const result = await this.getCollection<T>(collection, {
			...options,
			where: {
				...(options?.where ?? {}),
				slug: { equals: slug },
			},
			limit: 1,
		})

		return result.docs[0] ?? null
	}
}

export const payloadClient = new PayloadClient()
