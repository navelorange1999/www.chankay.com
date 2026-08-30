import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

type PackageConfig = {
	scripts?: Record<string, string>
}

type TurboConfig = {
	tasks?: Record<string, { dependsOn?: string[] }>
}

function readJson<T>(relativePath: string): T {
	return JSON.parse(readFileSync(path.resolve(process.cwd(), relativePath), "utf8")) as T
}

describe("workspace task configuration", () => {
	it("prepares admin workspace dependencies before Payload migrations", () => {
		const adminPackage = readJson<PackageConfig>("package.json")
		const scripts = adminPackage.scripts ?? {}

		expect(scripts["prepare:payload"]).toBe("turbo run build --filter=admin^...")
		for (const scriptName of ["migrate", "migrate:down", "migrate:status", "migrate:create"]) {
			expect(scripts[scriptName]).toMatch(/^pnpm prepare:payload && payload /)
		}
	})

	it("preserves transitive workspace builds for development and UI builds", () => {
		const wwwTurbo = readJson<TurboConfig>("../www/turbo.json")
		const uiTurbo = readJson<TurboConfig>("../../packages/ui/turbo.json")

		expect(wwwTurbo.tasks?.dev?.dependsOn).toContain("^build")
		expect(uiTurbo.tasks?.build?.dependsOn).toContain("^build")
	})
})
