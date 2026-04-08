import { cache } from "react"

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "@/utils/payloadClient"

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
	return payloadClient.getGlobal<SiteConfig>("site-config", {
		tags: ["global:site-config"],
	})
})

export async function getSiteConfigLatest(): Promise<SiteConfig> {
	return payloadClient.getGlobal<SiteConfig>("site-config", {
		cache: "no-store",
	})
}
