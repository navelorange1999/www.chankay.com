import { spawn } from "node:child_process"
import { watch } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { copyTokens } from "./copy-tokens.mjs"
import { startPreviewServer } from "./serve-preview.mjs"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sharedTokensSourcePath = resolve(packageRoot, "../ui/src/tokens.css")
const tokensAliasesSourcePath = resolve(packageRoot, "src/tokens.aliases.css")
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

function spawnProcess(args) {
	return spawn(pnpmCommand, args, {
		cwd: packageRoot,
		stdio: "inherit",
	})
}

function runOnce(args) {
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawnProcess(args)

		child.on("exit", (code) => {
			if (code === 0) {
				resolvePromise(undefined)
				return
			}

			rejectPromise(new Error(`Command failed: ${pnpmCommand} ${args.join(" ")}`))
		})

		child.on("error", rejectPromise)
	})
}

async function main() {
	await runOnce(["build"])

	const server = startPreviewServer()
	const componentWatcher = spawnProcess([
		"build:components",
		"--watch",
		"--preserveWatchOutput",
	])
	const tokenWatchers = [sharedTokensSourcePath, tokensAliasesSourcePath].map((path) =>
		watch(path, async () => {
			try {
				await copyTokens()
				console.log("[site-shell] rebuilt dist/tokens.css from the shared token source")
			} catch (error) {
				console.error("[site-shell] failed to rebuild dist/tokens.css", error)
			}
		})
	)

	const shutdown = () => {
		for (const watcher of tokenWatchers) {
			watcher.close()
		}
		server.close()

		if (!componentWatcher.killed) {
			componentWatcher.kill("SIGINT")
		}
	}

	componentWatcher.on("exit", (code) => {
		if (code && code !== 0) {
			process.exitCode = code
		}
	})

	process.on("SIGINT", () => {
		shutdown()
		process.exit()
	})

	process.on("SIGTERM", () => {
		shutdown()
		process.exit()
	})
}

main().catch((error) => {
	console.error("[site-shell] failed to start local preview", error)
	process.exit(1)
})
