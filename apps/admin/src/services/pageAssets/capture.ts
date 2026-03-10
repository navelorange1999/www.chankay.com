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

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Cache-Control": "no-cache",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestBody),
	})

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

	return {
		buffer: Buffer.from(arrayBuffer),
		contentType,
		height: args.height,
		width: args.width,
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

	await fs.writeFile(tempFilePath, args.screenshot.buffer)

	try {
		return await args.req.payload.create({
			collection: "media",
			data: {
				alt: args.alt,
				height: args.screenshot.height,
				width: args.screenshot.width,
			},
			filePath: tempFilePath,
			overrideAccess: true,
		})
	} finally {
		await fs.rm(tempFilePath, { force: true })
	}
}
