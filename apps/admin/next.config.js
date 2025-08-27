import {withPayload} from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Your Next.js config here
	experimental: {
		reactCompiler: false,
	},
	typescript: {
		ignoreBuildErrors: false, // Keep type checking enabled
		tsconfigPath: "./tsconfig.json",
	},
};

// Make sure you wrap your `nextConfig`
// with the `withPayload` plugin
export default withPayload(nextConfig);
