import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(dirname, "src"),
			"#utils": path.resolve(dirname, "../../packages/ui/src/utils"),
		},
	},
	test: {
		environment: "node",
	},
})
