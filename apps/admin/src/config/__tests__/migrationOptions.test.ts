import { describe, expect, it } from "vitest"

import {
	buildMigrationEnvironment,
	parseMigrationArgs,
} from "../../../scripts/migrationOptions.mjs"

describe("migration environment selection", () => {
	it.each(["migrate", "migrate:status"])(
		"accepts pnpm's argument separator when selecting an environment for %s",
		(command) => {
			expect(parseMigrationArgs([command, "--", "--env-file", ".env.prod"])).toEqual({
				command,
				envFile: ".env.prod",
				payloadArgs: [],
			})
		}
	)

	it.each(["migrate", "migrate:status", "migrate:down", "migrate:create"])(
		"supports an explicit environment file for %s",
		(command) => {
			expect(parseMigrationArgs([command, "--env-file", ".env.prod"])).toEqual({
				command,
				envFile: ".env.prod",
				payloadArgs: [],
			})
		}
	)

	it("supports equals syntax and forwards Payload options", () => {
		expect(
			parseMigrationArgs([
				"migrate:create",
				"--",
				"example",
				"--env-file=.env.prod",
				"--skip-empty",
			])
		).toEqual({
			command: "migrate:create",
			envFile: ".env.prod",
			payloadArgs: ["example", "--skip-empty"],
		})
	})

	it("preserves the default command without an explicit file", () => {
		expect(parseMigrationArgs(["migrate:status"])).toEqual({
			command: "migrate:status",
			envFile: undefined,
			payloadArgs: [],
		})
	})

	it.each(["../.env.prod", "/tmp/.env.prod", ".env.prod/other", "", "--help"])(
		"rejects unsafe or missing filenames: %s",
		(filename) => {
			expect(() => parseMigrationArgs(["migrate", "--env-file", filename])).toThrow()
		}
	)

	it("rejects a missing value and duplicate environment selectors", () => {
		expect(() => parseMigrationArgs(["migrate", "--env-file"])).toThrow()
		expect(() =>
			parseMigrationArgs(["migrate", "--env-file=.env.prod", "--env-file=.env.local"])
		).toThrow()
	})

	it("lets the explicit file override an inherited database connection", () => {
		const inherited = { DATABASE_URI: "mongodb://127.0.0.1/local", PATH: "/usr/bin" }
		const environment = buildMigrationEnvironment(
			'DATABASE_URI="mongodb://127.0.0.1/selected"\nNODE_ENV=production',
			inherited
		)
		expect(environment.DATABASE_URI).toBe("mongodb://127.0.0.1/selected")
		expect(environment.NODE_ENV).toBe("production")
		expect(environment.PATH).toBe("/usr/bin")
		expect(inherited.DATABASE_URI).toBe("mongodb://127.0.0.1/local")
	})

	it.each(["", "OTHER_VALUE=example", "DATABASE_URI=", "DATABASE_URI=not-a-database"])(
		"refuses to fall back to an inherited connection for an incomplete file",
		(contents) => {
			expect(() =>
				buildMigrationEnvironment(contents, { DATABASE_URI: "mongodb://127.0.0.1/local" })
			).toThrow()
		}
	)

	it("rejects unexpanded references instead of selecting an ambiguous target", () => {
		expect(() => buildMigrationEnvironment("DATABASE_URI=${OTHER_DATABASE}", {})).toThrow()
	})
})
