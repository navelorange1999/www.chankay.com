import { promises as fs } from "fs"
import { tmpdir } from "os"
import { join } from "path"

import { DEFAULT_WAIT_FOR_MS } from "./constants"
import type { GeneratedImage, LoggerLike, PageAssetsRequest } from "./types"
import {
	asOptionalString,
	buildGeneratedFilename,
	redactRequestHeaders,
	redactUrlToken,
} from "./utils"

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

	const sanitizedRequestBody = {
		...requestBody,
		setExtraHTTPHeaders: redactRequestHeaders(args.requestHeaders),
	}

	args.logger?.info(
		`Browserless screenshot request: ${redactUrlToken(endpoint)} body=${JSON.stringify(sanitizedRequestBody)}`
	)

	// Add timeout control for Vercel environment (25 seconds to stay under 30s limit)
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 25000)

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
		clearTimeout(timeoutId)

		if (!response.ok) {
			const errorText = (await response.text().catch(() => "")).trim()
			throw new Error(
				errorText
					? `Preview capture failed (${response.status}): ${errorText}`
					: `Preview capture failed (${response.status})`
			)
		}

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
			`Browserless screenshot received: ${(arrayBuffer.byteLength / 1024).toFixed(2)}KB`
		)

		return {
			buffer: Buffer.from(arrayBuffer),
			contentType,
			height: args.height,
			width: args.width,
		}
	} catch (error) {
		clearTimeout(timeoutId)
		// Re-throw with more context
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Browserless request timeout after 25 seconds`)
		}
		throw error
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
		// Log file write attempt
		args.req.payload.logger?.info(
			`Writing screenshot to temp file: ${tempFilePath} (${(args.screenshot.buffer.length / 1024).toFixed(2)}KB)`
		)

		await fs.writeFile(tempFilePath, args.screenshot.buffer)

		try {
			// Log media creation attempt
			args.req.payload.logger?.info(`Creating media document for: ${filename}`)

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

			args.req.payload.logger?.info(`Media document created successfully: ${media.id}`)

			return media
		} finally {
			await fs.rm(tempFilePath, { force: true }).catch((error) => {
				// Log but don't throw on cleanup failure
				args.req.payload.logger?.warn(`Failed to clean up temp file ${tempFilePath}: ${error}`)
			})
		}
	} catch (error) {
		// Log detailed error information
		const errorMessage = error instanceof Error ? error.message : String(error)
		args.req.payload.logger?.error(`Failed to persist generated media: ${errorMessage}`, {
			filename,
			tempFilePath,
			bufferSize: args.screenshot.buffer.length,
			subject: args.subject,
		})
		throw error
	}
}
