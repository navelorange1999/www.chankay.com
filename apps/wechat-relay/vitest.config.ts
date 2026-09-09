import { fileURLToPath } from "node:url"

export default {
	test: {
		environment: "node",
		include: ["apps/wechat-relay/src/**/__tests__/**/*.test.ts"],
	},
	resolve: {
		alias: {
			"@chankay/wechat-relay-protocol": fileURLToPath(
				new URL("../../packages/wechat-relay-protocol/src/index.ts", import.meta.url)
			),
		},
	},
}
