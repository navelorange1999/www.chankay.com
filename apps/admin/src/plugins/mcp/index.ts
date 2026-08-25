import { mcpPlugin } from "@payloadcms/plugin-mcp"

import { mcpCollections } from "./collections"
import { mcpGlobals } from "./globals"
import { pageTools } from "./page"
import { postTools } from "./post"

export const payloadMcpPlugin = mcpPlugin({
	collections: mcpCollections,
	globals: mcpGlobals,
	mcp: {
		handlerOptions: {
			verboseLogs: false,
		},
		serverOptions: {
			serverInfo: {
				name: "Chankay Payload MCP",
				version: "1.1.0",
			},
		},
		tools: [...postTools, ...pageTools],
	},
})
