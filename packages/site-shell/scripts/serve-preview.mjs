import { createReadStream } from "node:fs"
import { access } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, resolve, sep } from "node:path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const defaultPreviewPath = "/dev/preview.html"
const port = Number.parseInt(process.env.SITE_SHELL_PORT ?? "4310", 10)

const mimeTypes = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
}

function resolveRequestPath(urlPath) {
	const normalizedPath = urlPath === "/" ? defaultPreviewPath : urlPath
	const safePath = resolve(packageRoot, `.${normalizedPath}`)

	if (safePath !== packageRoot && !safePath.startsWith(`${packageRoot}${sep}`)) {
		return null
	}

	return safePath
}

function sendNotFound(response) {
	response.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
	response.end("Not found")
}

function sendServerError(response, error) {
	response.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
	response.end(`Failed to serve preview asset: ${error instanceof Error ? error.message : "Unknown error"}`)
}

export function startPreviewServer() {
	const server = createServer(async (request, response) => {
		try {
			const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1")
			const filePath = resolveRequestPath(requestUrl.pathname)

			if (!filePath) {
				sendNotFound(response)
				return
			}

			await access(filePath)

			const extension = extname(filePath)
			const contentType = mimeTypes[extension] ?? "application/octet-stream"
			response.writeHead(200, { "content-type": contentType })
			createReadStream(filePath).pipe(response)
		} catch (error) {
			if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
				sendNotFound(response)
				return
			}

			sendServerError(response, error)
		}
	})

	server.listen(port, () => {
		console.log(`[site-shell] preview available at http://127.0.0.1:${port}${defaultPreviewPath}`)
	})

	return server
}

if (import.meta.url === `file://${process.argv[1]}`) {
	startPreviewServer()
}
