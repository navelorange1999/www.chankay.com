import path from "path"
import { fileURLToPath } from "url"
import bundleAnalyzer from "@next/bundle-analyzer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, "../..")
const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {
		root: repoRoot,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
}

export default withBundleAnalyzer(nextConfig)
