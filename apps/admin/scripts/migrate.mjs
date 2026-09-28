import { spawnSync } from "node:child_process"
import { readFileSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
	buildMigrationEnvironment,
	MigrationConfigurationError,
	parseMigrationArgs,
} from "./migrationOptions.mjs"

const adminDirectory = realpathSync(fileURLToPath(new URL("../", import.meta.url)))

function run() {
	const { command, envFile, payloadArgs } = parseMigrationArgs(process.argv.slice(2))
	/** @type {Record<string, string | undefined>} */
	let environment = process.env

	if (envFile) {
		let contents
		try {
			const filePath = realpathSync(path.join(adminDirectory, envFile))
			if (path.dirname(filePath) !== adminDirectory) {
				throw new Error("Environment file is outside the admin directory.")
			}
			contents = readFileSync(filePath, "utf8")
		} catch {
			throw new MigrationConfigurationError(
				"Cannot load the selected environment file from apps/admin."
			)
		}
		environment = buildMigrationEnvironment(contents, process.env)
		console.log(`Using environment file: ${envFile}`)
	}

	const require = createRequire(import.meta.url)
	const payloadCli = path.resolve(path.dirname(require.resolve("payload")), "../bin.js")
	const result = spawnSync(process.execPath, [payloadCli, command, ...payloadArgs], {
		cwd: adminDirectory,
		env: environment,
		stdio: "inherit",
		shell: false,
	})
	if (result.error)
		throw new MigrationConfigurationError("Could not start the Payload migration command.")
	process.exitCode = result.status ?? 1
}

try {
	run()
} catch (error) {
	console.error(
		error instanceof MigrationConfigurationError ? error.message : "Migration command failed."
	)
	process.exitCode = 1
}
