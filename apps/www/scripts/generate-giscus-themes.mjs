import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const tokensPath = resolve(appRoot, "../../packages/ui/src/tokens.css")
const outputDirectory = resolve(appRoot, "public/giscus")
const requiredTokens = [
	"background",
	"foreground",
	"popover",
	"muted",
	"muted-foreground",
	"border",
	"input",
	"primary",
	"primary-foreground",
	"secondary",
	"secondary-foreground",
	"accent",
	"destructive",
]

function readPalette(source, mode) {
	const pattern =
		mode === "light" ? /^:root\s*\{([^}]*)\}/m : /^\.dark,\s*\[data-theme="dark"\]\s*\{([^}]*)\}/m
	const block = source.match(pattern)?.[1]
	if (!block) throw new Error(`Missing ${mode} theme block in tokens.css`)

	const declarations = new Map(
		[...block.matchAll(/^\s*--([a-z-]+):\s*([^;\n]+);/gm)].map((match) => [
			match[1],
			match[2].trim(),
		])
	)
	return Object.fromEntries(
		requiredTokens.map((name) => {
			const value = declarations.get(name)
			if (!value || !/^oklch\([\d.\s/]+\)$/.test(value)) {
				throw new Error(`Invalid --${name} in ${mode} theme`)
			}
			return [name, value]
		})
	)
}

function renderTheme(palette, mode) {
	const dark = mode === "dark"
	const site = (name) => `var(--site-${name})`
	const tint = (name, amount) => `color-mix(in oklch, ${site(name)} ${amount}%, transparent)`
	const primaryHover = `color-mix(in oklch, ${site("primary")} 90%, ${dark ? "white" : "black"})`
	const primarySelected = `color-mix(in oklch, ${site("primary")} 85%, black)`
	const variables = [
		["fg-default", site("foreground")],
		["fg-muted", site("muted-foreground")],
		["fg-subtle", site("muted-foreground")],
		["canvas-default", site("background")],
		["canvas-overlay", site("popover")],
		["canvas-inset", site("muted")],
		["canvas-subtle", site(dark ? "accent" : "muted")],
		["border-default", site("border")],
		["border-muted", site("border")],
		["neutral-muted", site("muted")],
		["accent-fg", site(dark ? "primary" : "secondary-foreground")],
		["accent-emphasis", site("primary")],
		["accent-muted", tint("primary", 30)],
		["accent-subtle", dark ? tint("primary", 15) : site("secondary")],
		["success-fg", site(dark ? "primary" : "secondary-foreground")],
		["danger-fg", site("destructive")],
		["btn-text", site("foreground")],
		["btn-bg", site(dark ? "popover" : "background")],
		["btn-border", site("border")],
		["btn-hover-bg", dark ? `color-mix(in oklch, ${site("popover")} 90%, white)` : site("muted")],
		[
			"btn-hover-border",
			dark ? `color-mix(in oklch, ${site("border")} 90%, white)` : site("input"),
		],
		["btn-active-bg", site("accent")],
		["btn-active-border", site("primary")],
		["btn-selected-bg", site("accent")],
		["btn-primary-text", site("primary-foreground")],
		["btn-primary-bg", site("primary")],
		["btn-primary-border", site("primary")],
		["btn-primary-hover-bg", primaryHover],
		["btn-primary-hover-border", primaryHover],
		["btn-primary-selected-bg", primarySelected],
		["btn-primary-disabled-text", tint("primary-foreground", 70)],
		["btn-primary-disabled-bg", tint("primary", 60)],
		["btn-primary-disabled-border", tint("primary", 30)],
		["action-list-item-default-hover-bg", dark ? tint("primary", 12) : tint("accent", 50)],
		["segmented-control-bg", site("muted")],
		["segmented-control-button-bg", site(dark ? "popover" : "background")],
		["segmented-control-button-selected-border", site("border")],
		["social-reaction-bg-hover", dark ? tint("primary", 12) : site("accent")],
		["social-reaction-bg-reacted-hover", dark ? tint("primary", 25) : site("accent")],
	]
	const siteVariables = requiredTokens.map((name) => `\t--site-${name}: ${palette[name]};`)
	const giscusVariables = variables.map(([name, value]) => `\t--color-${name}: ${value};`)
	return [
		"/* Generated from packages/ui/src/tokens.css. Run pnpm generate:giscus-themes to update. */",
		"main {",
		...siteVariables,
		...giscusVariables,
		"}",
		"",
	].join("\n")
}

async function main() {
	const source = await readFile(tokensPath, "utf8")
	const check = process.argv.includes("--check")
	if (!check) await mkdir(outputDirectory, { recursive: true })
	for (const mode of ["light", "dark"]) {
		const outputPath = resolve(outputDirectory, `theme-${mode}.css`)
		const generated = renderTheme(readPalette(source, mode), mode)
		if (check) {
			const current = await readFile(outputPath, "utf8").catch(() => "")
			if (current !== generated) {
				throw new Error(`Giscus ${mode} theme is out of date. Run pnpm generate:giscus-themes.`)
			}
		} else {
			await writeFile(outputPath, generated)
		}
	}
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
