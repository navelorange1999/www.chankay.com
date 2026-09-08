export type SocialPlatform = "wechat-official-account"
export type SocialPublicationStage =
	| "prepare"
	| "token"
	| "media"
	| "create-draft"
	| "publish"
	| "status-check"
export type WeChatSettings = { author: string; openComments: boolean; onlyFansCanComment: boolean }
export type PublicationSourceSnapshot = {
	accountId: string
	platform: SocialPlatform
	providerAccountId: string
	postId: string
	locale: string
	title: string
	excerpt: string
	markdown: string
	coverMediaId: string
	media: Array<{ id: string; url: string; mimeType: string; updatedAt: string }>
	canonicalUrl: string
	adapterVersion: string
	settings: WeChatSettings
}
export type PreparedPlatformPayload = {
	platform: SocialPlatform
	adapterVersion: string
	title: string
	summary: string
	html: string
	coverMediaId: string
	images: Array<{ id: string; url: string }>
	canonicalUrl: string
	settings: WeChatSettings
	warnings: string[]
}
export type RemoteResult = {
	draftId?: string
	submissionId?: string
	publicationId?: string
	url?: string
	status?: "pending" | "published" | "failed"
	media?: Record<string, string>
}
export type SocialCredentials = { providerAccountId: string; appId: string; appSecret: string }
export type AdapterExecutionContext = {
	deadline?: number
	credentials: SocialCredentials
	remote: RemoteResult
	loadMedia: (id: string) => Promise<{ bytes: Uint8Array; mimeType: string }>
	checkpoint: (remote: RemoteResult) => Promise<void>
}
export interface SocialPublisherAdapter {
	platform: SocialPlatform
	version: string
	capabilities: {
		remoteDraft: "required" | "optional" | "unsupported"
		asyncPublishStatus: boolean
	}
	prepare(source: PublicationSourceSnapshot): Promise<PreparedPlatformPayload>
	validatePrepared(value: unknown): PreparedPlatformPayload
	createDraft?(
		prepared: PreparedPlatformPayload,
		context: AdapterExecutionContext
	): Promise<RemoteResult>
	publish(
		prepared: PreparedPlatformPayload,
		context: AdapterExecutionContext
	): Promise<RemoteResult>
	getStatus?(remote: RemoteResult, context: AdapterExecutionContext): Promise<RemoteResult>
}
export class SocialPublishingError extends Error {
	readonly stage: SocialPublicationStage
	readonly code?: string
	readonly retryable: boolean
	readonly ambiguous: boolean
	constructor(
		stage: SocialPublicationStage,
		code = "VALIDATION",
		retryable = false,
		ambiguous = false
	) {
		super(
			code === "VALIDATION"
				? "Social publishing validation failed."
				: "Social publishing provider request failed."
		)
		this.name = "SocialPublishingError"
		this.stage = stage
		this.code = /^[A-Z0-9_-]{1,48}$/.test(code) ? code : "PROVIDER_ERROR"
		this.retryable = retryable
		this.ambiguous = ambiguous
	}
}
export function safeError(error: unknown, stage: SocialPublicationStage) {
	const safe =
		error instanceof SocialPublishingError
			? error
			: new SocialPublishingError(
					stage,
					"INTERNAL",
					false,
					stage !== "prepare" && stage !== "token"
				)
	return {
		message: safe.message,
		stage: safe.stage,
		code: safe.code,
		retryable: safe.retryable,
		ambiguous: safe.ambiguous,
		occurredAt: new Date().toISOString(),
	}
}
