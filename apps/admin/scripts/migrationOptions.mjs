import { parseEnv } from "node:util"

const COMMANDS = new Set(["migrate", "migrate:status", "migrate:down", "migrate:create"])

export class MigrationConfigurationError extends Error {}

/** @param {string[]} args */
export function parseMigrationArgs(args) {
	const [command, ...options] = args
	if (!COMMANDS.has(command))
		throw new MigrationConfigurationError("Unsupported migration command.")

	/** @type {string | undefined} */
	let envFile
	const payloadArgs = []
	for (let index = 0; index < options.length; index += 1) {
		const option = options[index]
		// pnpm 11 requires this separator to forward --env-file instead of consuming it itself.
		if (option === "--") continue
		if (option === "--env-file" || option.startsWith("--env-file=")) {
			if (envFile !== undefined)
				throw new MigrationConfigurationError("Specify --env-file only once.")
			const value = option === "--env-file" ? options[++index] : option.slice(11)
			if (!value || value.length > 100 || !/^\.env(?:\.[a-zA-Z0-9_-]+)*$/.test(value)) {
				throw new MigrationConfigurationError(
					"Use --env-file with an environment filename inside apps/admin."
				)
			}
			envFile = value
		} else {
			payloadArgs.push(option)
		}
	}

	return { command, envFile, payloadArgs }
}

/**
 * @param {string} contents
 * @param {Record<string, string | undefined>} inheritedEnv
 * @returns {Record<string, string | undefined>}
 */
export function buildMigrationEnvironment(contents, inheritedEnv) {
	let selected
	try {
		selected = parseEnv(contents)
	} catch {
		throw new MigrationConfigurationError("The selected environment file could not be parsed.")
	}

	const database = selected.DATABASE_URI
	if (!database || !/^mongodb(?:\+srv)?:\/\/\S+$/.test(database) || database.includes("${")) {
		throw new MigrationConfigurationError(
			"The selected environment file must define a complete MongoDB DATABASE_URI."
		)
	}

	// Explicit file values must win over a connection inherited from the invoking terminal.
	return { ...inheritedEnv, ...selected }
}
