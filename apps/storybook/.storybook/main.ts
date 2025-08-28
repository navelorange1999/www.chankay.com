import type { StorybookConfig } from "@storybook/react-vite"

import { join, dirname, resolve } from "path"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, "package.json")))
}

const config: StorybookConfig = {
	stories: ["../stories/*.stories.tsx", "../stories/**/*.stories.tsx"],
	addons: ["@storybook/addon-links", "@storybook/addon-docs"].map(getAbsolutePath),
	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {},
	},

	async viteFinal(config) {
		// customize the Vite config here
		return {
			...config,
			define: { "process.env": {} },
			resolve: {
				alias: [
					// 样式 alias 必须在组件 alias 之前，否则会被前者覆盖
					{
						find: "@repo/ui/styles.css",
						replacement: resolve(__dirname, "../../../packages/ui/dist/index.css"),
					},
					{
						find: "@repo/ui",
						replacement: resolve(__dirname, "../../../packages/ui/src"),
					},
					{
						find: "@repo/tailwind-config",
						replacement: resolve(__dirname, "../../../packages/tailwind-config"),
					},
				],
			},
		}
	},

	docs: {
		//👇 See the table below for the list of supported options
		defaultName: "Documentation",
	},
}
export default config
