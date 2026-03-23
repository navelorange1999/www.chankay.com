import { mcpPlugin } from "@payloadcms/plugin-mcp"

import { mcpCollections } from "./collections"
import { pageTools } from "./page"
import { postTools } from "./post"
import { siteConfigResources, siteConfigTools } from "./site-config"

export const payloadMcpPlugin = mcpPlugin({
	collections: mcpCollections,
	mcp: {
		handlerOptions: {
			verboseLogs: false,
		},
		resources: siteConfigResources,
		serverOptions: {
			serverInfo: {
				name: "Chankay Payload MCP",
				version: "1.1.0",
			},
		},
		tools: [...siteConfigTools, ...postTools, ...pageTools],
	},
})
