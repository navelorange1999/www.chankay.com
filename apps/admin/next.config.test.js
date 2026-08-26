import { describe, expect, it } from "vitest"

import nextConfig from "./next.config.js"

describe("admin Next.js config", () => {
	it("loads Vercel Queue outside the Turbopack server bundle", () => {
		expect(nextConfig.serverExternalPackages).toContain("@vercel/queue")
	})
})
