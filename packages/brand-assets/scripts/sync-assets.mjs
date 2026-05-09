import { cp, mkdir, readdir, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = resolve(packageRoot, "../..")
const sourceFaviconDir = resolve(packageRoot, "assets/favicon")

const APP_CONFIG = {
	admin: {
		root: resolve(repoRoot, "apps/admin"),
		usesNextMetadataIcons: false,
	},
	www: {
		root: resolve(repoRoot, "apps/www"),
		usesNextMetadataIcons: false,
	},
}

const METADATA_ICON_MAP = [
	["favicon.ico", "favicon.ico"],
	["android-chrome-192x192.png", "icon.png"],
	["apple-touch-icon.png", "apple-icon.png"],
]

async function copyDirectoryContents(sourceDir, targetDir) {
	await mkdir(targetDir, { recursive: true })

	const entries = await readdir(sourceDir, { withFileTypes: true })

	for (const entry of entries) {
		if (!entry.isFile()) {
			continue
		}

		await cp(resolve(sourceDir, entry.name), resolve(targetDir, entry.name), {
			force: true,
		})
	}
}

async function syncAppAssets(appName) {
	const appConfig = APP_CONFIG[appName]

	if (!appConfig) {
		throw new Error(`Unsupported app target: ${appName}`)
	}

	const { root: appRoot, usesNextMetadataIcons } = appConfig
	const publicFaviconDir = resolve(appRoot, "public/favicon")
	const appDir = resolve(appRoot, "src/app")

	await copyDirectoryContents(sourceFaviconDir, publicFaviconDir)

	if (usesNextMetadataIcons) {
		await mkdir(appDir, { recursive: true })

		for (const [sourceName, targetName] of METADATA_ICON_MAP) {
			await cp(resolve(sourceFaviconDir, sourceName), resolve(appDir, targetName), {
				force: true,
			})
		}
	} else {
		for (const [, targetName] of METADATA_ICON_MAP) {
			await rm(resolve(appDir, targetName), { force: true })
		}
	}

	console.log(`[brand-assets] synced shared assets into apps/${appName}`)
}

const appName = process.argv[2]

if (!appName) {
	console.error("Usage: node scripts/sync-assets.mjs <www|admin>")
	process.exit(1)
}

syncAppAssets(appName).catch((error) => {
	console.error("[brand-assets] failed to sync assets", error)
	process.exit(1)
})
