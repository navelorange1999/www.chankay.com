import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const stubs = vi.hoisted(() => ({
	spawnSync: vi.fn(),
	readFileSync: vi.fn(),
	realpathSync: vi.fn(),
}))
vi.mock("node:child_process", () => ({ spawnSync: stubs.spawnSync }))
vi.mock("node:fs", () => ({ readFileSync: stubs.readFileSync, realpathSync: stubs.realpathSync }))

const originalArgv = process.argv
const originalExitCode = process.exitCode

beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	vi.spyOn(console, "log").mockImplementation(() => {})
	vi.spyOn(console, "error").mockImplementation(() => {})
	vi.stubEnv("DATABASE_URI", "mongodb://127.0.0.1/local")
	process.argv = ["node", "migrate.mjs", "migrate:status", "--", "--env-file", ".env.example"]
	stubs.realpathSync.mockImplementation((value: string) =>
		value.endsWith(".env.example") ? "/workspace/apps/admin/.env.example" : "/workspace/apps/admin"
	)
	stubs.readFileSync.mockReturnValue("DATABASE_URI=mongodb://127.0.0.1/selected")
	stubs.spawnSync.mockReturnValue({ status: 0 })
})

afterEach(() => {
	process.argv = originalArgv
	process.exitCode = originalExitCode
	vi.unstubAllEnvs()
	vi.restoreAllMocks()
})

describe("migration runner", () => {
	it("passes the selected connection to Payload without passing the custom CLI flag", async () => {
		await import("../../../scripts/migrate.mjs")
		expect(stubs.spawnSync).toHaveBeenCalledWith(
			process.execPath,
			[expect.stringMatching(/payload\/bin\.js$/), "migrate:status"],
			expect.objectContaining({
				cwd: "/workspace/apps/admin",
				env: expect.objectContaining({ DATABASE_URI: "mongodb://127.0.0.1/selected" }),
				shell: false,
			})
		)
		expect(process.env.DATABASE_URI).toBe("mongodb://127.0.0.1/local")
		expect(process.exitCode).toBe(0)
	})

	it("does not start Payload when the selected file is missing", async () => {
		stubs.readFileSync.mockImplementation(() => {
			throw new Error("Unavailable file")
		})
		await import("../../../scripts/migrate.mjs")
		expect(stubs.spawnSync).not.toHaveBeenCalled()
		expect(process.exitCode).toBe(1)
	})

	it("rejects symlinks that resolve outside the admin directory", async () => {
		stubs.realpathSync
			.mockReturnValueOnce("/workspace/apps/admin")
			.mockReturnValueOnce("/elsewhere/.env.example")
		await import("../../../scripts/migrate.mjs")
		expect(stubs.readFileSync).not.toHaveBeenCalled()
		expect(stubs.spawnSync).not.toHaveBeenCalled()
		expect(process.exitCode).toBe(1)
	})

	it("propagates migration failures", async () => {
		stubs.spawnSync.mockReturnValue({ status: 2 })
		await import("../../../scripts/migrate.mjs")
		expect(process.exitCode).toBe(2)
	})

	it("does not expose unexpected error details", async () => {
		stubs.spawnSync.mockImplementation(() => {
			throw new Error("Unexpected internal detail")
		})
		await import("../../../scripts/migrate.mjs")
		expect(console.error).toHaveBeenCalledWith("Migration command failed.")
		expect(process.exitCode).toBe(1)
	})
})
