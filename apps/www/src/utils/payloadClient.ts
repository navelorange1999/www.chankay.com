import type { SupportedLocale } from "@repo/i18n"

export interface PayloadQueryOptions {
	locale?: SupportedLocale
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

function localeSuffix(locale: SupportedLocale | undefined): string {
	return locale ? `:${locale}` : ""
}

function appendLocale(
	params: URLSearchParams,
	locale: SupportedLocale | undefined
): URLSearchParams {
	if (locale) {
		params.append("locale", locale)
	}
	return params
}

function appendWhereParams(
	params: URLSearchParams,
	where: Record<string, unknown>,
	path: string[] = []
): void {
	Object.entries(where).forEach(([key, value]) => {
		const nextPath = [...path, key]

		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				if (item && typeof item === "object") {
					appendWhereParams(params, item as Record<string, unknown>, [...nextPath, String(index)])
				}
			})
			return
		}

		if (value && typeof value === "object") {
			appendWhereParams(params, value as Record<string, unknown>, nextPath)
			return
		}

		params.append(`where${nextPath.map((segment) => `[${segment}]`).join("")}`, String(value))
	})
}

export class PayloadClient {
	private baseUrl: string

	constructor(baseUrl: string = resolvePayloadBaseUrl()) {
		this.baseUrl = baseUrl
	}

	async getGlobal<T>(slug: string, options?: PayloadQueryOptions): Promise<T> {
		const params = appendLocale(new URLSearchParams(), options?.locale)
		const query = params.toString()
		const url = `${this.baseUrl}/globals/${slug}${query ? `?${query}` : ""}`

		const nextOptions =
			options?.cache === "no-store"
				? undefined
				: {
						revalidate:
							options?.revalidate ?? parseInt(process.env.PAYLOAD_REVALIDATE_TIME || "60"),
						tags: options?.tags ?? [`global:${slug}${localeSuffix(options?.locale)}`],
					}

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: nextOptions,
			cache: options?.cache,
		})

		if (!response.ok) {
			const body = await response.text().catch(() => "")
			console.error(`[PayloadClient] ${response.status} from ${url}`, body.slice(0, 200))
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
			sort?: string
		}
	): Promise<{ docs: T[]; totalDocs: number; limit: number; page: number }> {
		const params = new URLSearchParams()

		if (options?.where) {
			appendWhereParams(params, options.where)
		}

		if (options?.depth !== undefined) params.append("depth", String(options.depth))
		if (options?.limit !== undefined) params.append("limit", String(options.limit))
		if (options?.page !== undefined) params.append("page", String(options.page))
		if (options?.sort) params.append("sort", options.sort)
		appendLocale(params, options?.locale)

		const url = `${this.baseUrl}/${collection}?${params.toString()}`

		const nextOptions =
			options?.cache === "no-store"
				? undefined
				: {
						revalidate:
							options?.revalidate ?? parseInt(process.env.PAYLOAD_REVALIDATE_TIME || "60"),
						tags: options?.tags ?? [`collection:${collection}${localeSuffix(options?.locale)}`],
					}

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			next: nextOptions,
			cache: options?.cache,
		})

		if (!response.ok) {
			const body = await response.text().catch(() => "")
			console.error(`[PayloadClient] ${response.status} from ${url}`, body.slice(0, 200))
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
