import {
	SocialPublishingError,
	type SocialCredentials,
	type SocialPublicationStage,
} from "../../types"

export type WeChatClientOptions = { fetch?: typeof fetch; now?: () => number; timeoutMs?: number }
type ProviderBody = Record<string, unknown>
const paths = new Set([
	"/cgi-bin/media/uploadimg",
	"/cgi-bin/material/add_material",
	"/cgi-bin/draft/add",
	"/cgi-bin/draft/get",
	"/cgi-bin/freepublish/submit",
	"/cgi-bin/freepublish/get",
])
export class WeChatClient {
	private readonly fetcher: typeof fetch
	private readonly now: () => number
	private readonly timeoutMs: number
	private readonly cache = new Map<
		string,
		{ secret: string; value: Promise<{ token: string; expiresAt: number }> }
	>()
	constructor(options: WeChatClientOptions = {}) {
		this.fetcher = options.fetch ?? fetch
		this.now = options.now ?? Date.now
		this.timeoutMs = Math.min(15000, Math.max(100, options.timeoutMs ?? 10000))
	}
	private async send(
		url: URL,
		body: unknown,
		stage: SocialPublicationStage,
		deadline?: number
	): Promise<ProviderBody> {
		const mutation = [
			"/cgi-bin/draft/add",
			"/cgi-bin/freepublish/submit",
			"/cgi-bin/media/uploadimg",
			"/cgi-bin/material/add_material",
		].includes(url.pathname)
		const remaining =
			deadline === undefined ? this.timeoutMs : Math.min(this.timeoutMs, deadline - this.now())
		if (remaining <= 0) throw new SocialPublishingError(stage, "BUDGET", true)
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), remaining)
		try {
			const response = await this.fetcher(url, {
				method: "POST",
				redirect: "error",
				signal: controller.signal,
				headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
				body: body instanceof FormData ? body : JSON.stringify(body),
			})
			if (!response.ok)
				throw new SocialPublishingError(
					stage,
					`HTTP_${response.status}`,
					!mutation && response.status >= 500,
					mutation
				)

			if (!response.body)
				throw new SocialPublishingError(stage, "MALFORMED_RESPONSE", !mutation, mutation)
			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let text = ""
			let bytes = 0
			try {
				while (true) {
					const chunk = await reader.read()
					if (chunk.done) break
					bytes += chunk.value.byteLength
					if (bytes > 1000000) {
						await reader.cancel()
						throw new SocialPublishingError(stage, "MALFORMED_RESPONSE", !mutation, mutation)
					}
					text += decoder.decode(chunk.value, { stream: true })
				}
				text += decoder.decode()
			} finally {
				reader.releaseLock()
			}
			const data: unknown = JSON.parse(text)
			if (!data || typeof data !== "object" || Array.isArray(data))
				throw new SocialPublishingError(stage, "MALFORMED_RESPONSE", !mutation, mutation)
			const record = data as ProviderBody
			if (
				record.errcode !== undefined &&
				(typeof record.errcode !== "number" || !Number.isSafeInteger(record.errcode))
			)
				throw new SocialPublishingError(stage, "MALFORMED_RESPONSE", !mutation, mutation)
			if (typeof record.errcode === "number" && record.errcode !== 0) {
				throw new SocialPublishingError(
					stage,
					String(record.errcode),
					[40001, 40014, 42001, 45009, 45011, -1].includes(record.errcode),
					false
				)
			}
			return record
		} catch (error) {
			if (error instanceof SocialPublishingError) throw error
			throw new SocialPublishingError(stage, "TRANSPORT", !mutation, mutation)
		} finally {
			clearTimeout(timeout)
		}
	}
	private async token(credentials: SocialCredentials, deadline?: number): Promise<string> {
		if (credentials.providerAccountId !== credentials.appId)
			throw new SocialPublishingError("token", "ACCOUNT_IDENTITY")
		let entry = this.cache.get(credentials.appId)
		if (entry && entry.secret === credentials.appSecret) {
			const cached = await entry.value
			if (cached.expiresAt > this.now()) return cached.token
		}
		const value = (async () => {
			const data = await this.send(
				new URL("https://api.weixin.qq.com/cgi-bin/stable_token"),
				{
					grant_type: "client_credential",
					appid: credentials.appId,
					secret: credentials.appSecret,
					force_refresh: false,
				},
				"token",
				deadline
			)
			if (
				typeof data.access_token !== "string" ||
				!data.access_token ||
				data.access_token.length > 4096 ||
				typeof data.expires_in !== "number" ||
				!Number.isFinite(data.expires_in) ||
				data.expires_in <= 60
			)
				throw new SocialPublishingError("token", "MALFORMED_RESPONSE", true)
			return {
				token: data.access_token,
				expiresAt: this.now() + (Math.min(data.expires_in, 7200) - 60) * 1000,
			}
		})()
		entry = { secret: credentials.appSecret, value }
		this.cache.set(credentials.appId, entry)
		try {
			return (await value).token
		} catch (error) {
			if (this.cache.get(credentials.appId) === entry) this.cache.delete(credentials.appId)
			throw error
		}
	}
	async request(
		path: string,
		body: unknown,
		credentials: SocialCredentials,
		stage: SocialPublicationStage,
		deadline?: number
	): Promise<ProviderBody> {
		if (!paths.has(path)) throw new SocialPublishingError(stage, "VALIDATION")
		if (deadline !== undefined && deadline <= this.now())
			throw new SocialPublishingError(stage, "BUDGET", true)
		for (let attempt = 0; attempt < 2; attempt++) {
			const url = new URL(path, "https://api.weixin.qq.com")
			url.searchParams.set("access_token", await this.token(credentials, deadline))
			if (path === "/cgi-bin/material/add_material") url.searchParams.set("type", "image")
			try {
				return await this.send(url, body, stage, deadline)
			} catch (error) {
				if (
					attempt === 0 &&
					error instanceof SocialPublishingError &&
					["40001", "40014", "42001"].includes(error.code ?? "")
				) {
					this.cache.delete(credentials.appId)
					continue
				}
				throw error
			}
		}
		throw new SocialPublishingError(stage, "PROVIDER_ERROR")
	}
}
export function providerId(value: unknown, stage: SocialPublicationStage): string {
	if (typeof value !== "string" || !value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value))
		throw new SocialPublishingError(
			stage,
			"MALFORMED_RESPONSE",
			stage === "status-check",
			stage !== "status-check"
		)
	return value
}
