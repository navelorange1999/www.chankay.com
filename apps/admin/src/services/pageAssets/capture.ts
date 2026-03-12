import { promises as fs } from "fs"
import { tmpdir } from "os"
import { join } from "path"

import { DEFAULT_WAIT_FOR_MS } from "./constants"
import type { GeneratedImage, LoggerLike, PageAssetsRequest } from "./types"
import { asOptionalString, buildGeneratedFilename, redactUrlToken } from "./utils"

const CAPTURE_RESPONSE_TIMEOUT_MS = 50_000

export async function captureScreenshot(args: {
	height: number
	logger?: LoggerLike
	requestHeaders?: Record<string, string>
	url: string
	waitForTimeoutMs?: number
	width: number
}): Promise<GeneratedImage> {
	const apiUrl = asOptionalString(process.env.PREVIEW_CAPTURE_API_URL)
	const apiKey = asOptionalString(process.env.PREVIEW_CAPTURE_API_KEY)

	if (!apiUrl || !apiKey) {
		throw new Error("Missing PREVIEW_CAPTURE_API_URL or PREVIEW_CAPTURE_API_KEY")
	}

	const endpoint = new URL(apiUrl)
	endpoint.searchParams.set("token", apiKey)
	endpoint.searchParams.set(
		"launch",
		JSON.stringify({
			defaultViewport: {
				height: args.height,
				width: args.width,
			},
		})
	)

	const requestBody = {
		bestAttempt: true,
		gotoOptions: {
			waitUntil: "networkidle2",
		},
		options: {
			fullPage: false,
			type: "png",
		},
		setExtraHTTPHeaders: args.requestHeaders,
		url: args.url,
		waitForTimeout: args.waitForTimeoutMs ?? DEFAULT_WAIT_FOR_MS,
	}

	// Log as JSON string for structured data in Vercel
	args.logger?.info(
		`Browserless screenshot request: ${JSON.stringify({
			endpoint: redactUrlToken(endpoint),
			targetUrl: args.url,
			viewport: `${args.width}x${args.height}`,
			waitForMs: args.waitForTimeoutMs,
		})}`
	)

	// Add timeout control for Vercel environment (50 seconds to stay under 60s limit)
	const controller = new AbortController()
	const startedAt = Date.now()
	let didTimeout = false
	let stage: "request" | "headers" | "body" = "request"
	const timeoutId = setTimeout(() => {
		didTimeout = true
		args.logger?.error?.(
			`Browserless screenshot timeout: ${JSON.stringify({
				targetUrl: args.url,
				elapsedMs: Date.now() - startedAt,
				stage,
				timeoutMs: CAPTURE_RESPONSE_TIMEOUT_MS,
			})}`
		)
		controller.abort()
	}, CAPTURE_RESPONSE_TIMEOUT_MS)

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Cache-Control": "no-cache",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
			signal: controller.signal,
		})
		stage = "headers"

		args.logger?.info(
			`Browserless screenshot headers received: ${JSON.stringify({
				targetUrl: args.url,
				status: response.status,
				elapsedMs: Date.now() - startedAt,
			})}`
		)

		if (!response.ok) {
			const errorText = (await response.text().catch(() => "")).trim()
			throw new Error(
				errorText
					? `Preview capture failed (${response.status}): ${errorText}`
					: `Preview capture failed (${response.status})`
			)
		}

		stage = "body"
		const contentType = response.headers.get("content-type") || "image/png"
		const arrayBuffer = await response.arrayBuffer()

		// Validate response
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			throw new Error("Browserless returned empty response")
		}

		// Check size limit (10MB)
		if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
			throw new Error(`Response too large: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`)
		}

		args.logger?.info(
			`Browserless screenshot received: ${JSON.stringify({
				sizeKB: Number((arrayBuffer.byteLength / 1024).toFixed(2)),
				contentType: contentType,
				elapsedMs: Date.now() - startedAt,
			})}`
		)

		return {
			buffer: Buffer.from(arrayBuffer),
			contentType,
			height: args.height,
			width: args.width,
		}
	} catch (error) {
		if (didTimeout || (error instanceof Error && error.name === "AbortError")) {
			throw new Error(
				`Browserless did not return a result within ${CAPTURE_RESPONSE_TIMEOUT_MS / 1000} seconds (stage: ${stage})`
			)
		}

		args.logger?.error?.(
			`Browserless screenshot failed: ${JSON.stringify({
				targetUrl: args.url,
				elapsedMs: Date.now() - startedAt,
				stage,
				error: error instanceof Error ? error.message : String(error),
			})}`
		)

		throw error
	} finally {
		clearTimeout(timeoutId)
	}
}

export async function persistGeneratedMedia(args: {
	alt: string
	contentType: string
	filenamePrefix: string
	req: PageAssetsRequest
	screenshot: GeneratedImage
	subject: string
}) {
	const filename = buildGeneratedFilename(args.filenamePrefix, args.subject, args.contentType)
	const tempFilePath = join(tmpdir(), filename)

	try {
		// Log file write attempt with structured data
		args.req.payload.logger?.info(
			`Writing screenshot to temp: ${filename} (${(args.screenshot.buffer.length / 1024).toFixed(2)}KB)`
		)

		await fs.writeFile(tempFilePath, args.screenshot.buffer)

		try {
			// Log media creation attempt
			args.req.payload.logger?.info(`Creating media document: ${filename}`)

			const media = await args.req.payload.create({
				collection: "media",
				data: {
					alt: args.alt,
					height: args.screenshot.height,
					width: args.screenshot.width,
				},
				filePath: tempFilePath,
				overrideAccess: true,
			})

			args.req.payload.logger?.info(`Media created successfully: ${media.id} (${filename})`)

			return media
		} finally {
			await fs.rm(tempFilePath, { force: true }).catch((error) => {
				// Log but don't throw on cleanup failure
				args.req.payload.logger?.warn(`Failed to clean up temp file ${filename}: ${String(error)}`)
			})
		}
	} catch (error) {
		// Log detailed error information
		const errorMessage = error instanceof Error ? error.message : String(error)
		args.req.payload.logger?.error(
			`Failed to persist media: ${errorMessage} [${filename}, ${(args.screenshot.buffer.length / 1024).toFixed(2)}KB, subject: ${args.subject}]`
		)
		throw error
	}
}
