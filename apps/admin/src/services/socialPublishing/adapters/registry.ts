import { SocialPublishingError, type SocialPublisherAdapter } from "../types"
import { createWeChatAdapter } from "./wechat"

const wechat = createWeChatAdapter()
export function getSocialPublisherAdapter(platform: string): SocialPublisherAdapter {
	if (platform === "wechat-official-account") return wechat
	throw new SocialPublishingError("prepare", "UNSUPPORTED_PLATFORM")
}
