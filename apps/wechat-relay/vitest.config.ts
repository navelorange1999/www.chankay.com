import { fileURLToPath } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url))

export default {
	root: repositoryRoot,
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
