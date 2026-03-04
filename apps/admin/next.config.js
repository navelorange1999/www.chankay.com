import path from "path"
import { fileURLToPath } from "url"
import { withPayload } from "@payloadcms/next/withPayload"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, "../..")

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Your Next.js config here
	turbopack: {
		root: repoRoot,
	},
	experimental: {
		reactCompiler: false,
	},
	typescript: {
		ignoreBuildErrors: false, // Keep type checking enabled
		tsconfigPath: "./tsconfig.json",
	},
}

// Make sure you wrap your `nextConfig`
// with the `withPayload` plugin
export default withPayload(nextConfig)
