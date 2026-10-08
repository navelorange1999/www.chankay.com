import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	resolve: {
		alias: {
			"@repo/ui/components/Heatmap": path.resolve(
				dirname,
				"../../packages/ui/src/components/Heatmap/Heatmap.tsx"
			),
			"motion/react": createRequire(import.meta.url).resolve("motion/react", {
				paths: [path.resolve(dirname, "../../packages/ui")],
			}),
			"@": path.resolve(dirname, "src"),
			"#utils": path.resolve(dirname, "../../packages/ui/src/utils"),
		},
	},
	test: {
		environment: "node",
	},
})
