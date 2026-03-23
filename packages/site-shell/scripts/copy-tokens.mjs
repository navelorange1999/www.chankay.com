import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sharedSourcePath = resolve(packageRoot, "../ui/src/tokens.css")
const aliasesSourcePath = resolve(packageRoot, "src/tokens.aliases.css")
const targetPath = resolve(packageRoot, "dist/tokens.css")

export async function copyTokens() {
	const [sharedTokens, siteShellAliases] = await Promise.all([
		readFile(sharedSourcePath, "utf8"),
		readFile(aliasesSourcePath, "utf8"),
	])

	const output = [
		"/* Generated from packages/ui/src/tokens.css and packages/site-shell/src/tokens.aliases.css */",
		sharedTokens.trim(),
		"",
		siteShellAliases.trim(),
		"",
	].join("\n")

	await mkdir(resolve(packageRoot, "dist"), { recursive: true })
	await writeFile(targetPath, output, "utf8")
}

await copyTokens()
