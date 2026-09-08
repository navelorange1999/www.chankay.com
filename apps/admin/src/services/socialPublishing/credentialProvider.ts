import { SocialPublishingError, type SocialCredentials } from "./types"

export const SOCIAL_CREDENTIAL_REFERENCES = ["wechat-primary"] as const

export function resolveSocialCredentials(
	reference: string,
	expectedProviderAccountId: string,
	environment: Record<string, string | undefined> = process.env
): SocialCredentials {
	if (reference !== "wechat-primary")
		throw new SocialPublishingError("token", "CREDENTIAL_REFERENCE")
	const appId = environment.WECHAT_PRIMARY_APP_ID
	const appSecret = environment.WECHAT_PRIMARY_APP_SECRET
	if (!appId || !appSecret || appId !== expectedProviderAccountId) {
		throw new SocialPublishingError("token", "ACCOUNT_IDENTITY")
	}
	return { providerAccountId: appId, appId, appSecret }
}
