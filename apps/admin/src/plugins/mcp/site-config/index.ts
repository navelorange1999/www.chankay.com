import { getSiteConfigTool } from "./tool"
import { siteConfigResource } from "./resource"
import { updateSiteConfigTool } from "./updateTool"

export const siteConfigResources = [siteConfigResource]
export const siteConfigTools = [getSiteConfigTool, updateSiteConfigTool]
