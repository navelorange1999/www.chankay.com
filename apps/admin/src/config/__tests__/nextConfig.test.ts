import { describe, expect, it } from "vitest"

type NextConfig = {
	serverExternalPackages?: string[]
}

describe("admin Next.js config", () => {
	it("loads Vercel Queue outside the Turbopack server bundle", async () => {
		const { default: nextConfig } = (await import("../../../next.config.js")) as {
			default: NextConfig
		}

		expect(nextConfig.serverExternalPackages).toContain("@vercel/queue")
	})
})
