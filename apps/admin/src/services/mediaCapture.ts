import type { CollectionBeforeOperationHook, PayloadRequest } from "payload"

import { captureScreenshot } from "@/services/pageAssets/capture"
import {
	DEFAULT_WAIT_FOR_MS,
	SKIP_MEDIA_SOURCE_CAPTURE_FLAG,
} from "@/services/pageAssets/constants"
import {
	asOptionalString,
	buildGeneratedFilename,
	resolveWaitForMs,
} from "@/services/pageAssets/utils"

type MediaDocLike = Record<string, unknown> & {
	captureUrl?: string | null
	captureWaitForMs?: number | null
	filename?: string | null
}

type MediaMutationData = Record<string, unknown>

function hasOwn(data: MediaMutationData, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(data, key)
}

function resolveNextValue(args: {
	data: MediaMutationData
	field: string
	originalDoc?: MediaDocLike
}): unknown {
	if (hasOwn(args.data, args.field)) {
		return args.data[args.field]
	}

	return args.originalDoc?.[args.field]
}

export function validateCaptureUrl(value: unknown): true | string {
	const captureUrl = asOptionalString(value)

	if (!captureUrl) {
		return true
	}

	try {
		const parsed = new URL(captureUrl)
		if (parsed.protocol !== "https:") {
			return "Capture URL must use https://"
		}
	} catch {
		return "Capture URL must be a valid URL"
	}

	return true
}

export function resolveMediaCapturePlan(args: {
	data: MediaMutationData
	hasUploadedFile: boolean
	operation: "create" | "update"
	originalDoc?: MediaDocLike
}) {
	const captureUrl = asOptionalString(
		resolveNextValue({
			data: args.data,
			field: "captureUrl",
			originalDoc: args.originalDoc,
		})
	)
	const waitForMs = resolveWaitForMs(
		resolveNextValue({
			data: args.data,
			field: "captureWaitForMs",
			originalDoc: args.originalDoc,
		}) ?? DEFAULT_WAIT_FOR_MS
	)
	const previousCaptureUrl = asOptionalString(args.originalDoc?.captureUrl)
	const previousWaitForMs = resolveWaitForMs(args.originalDoc?.captureWaitForMs)
	const hasExistingFile = Boolean(asOptionalString(args.originalDoc?.filename))

	if (args.hasUploadedFile && captureUrl) {
		throw new Error("Choose either a file upload or a Capture URL.")
	}

	if (args.operation === "create" && !args.hasUploadedFile && !captureUrl) {
		throw new Error("Upload a file or provide a Capture URL.")
	}

	return {
		captureUrl,
		shouldGenerate:
			Boolean(captureUrl) &&
			(args.operation === "create" ||
				captureUrl !== previousCaptureUrl ||
				waitForMs !== previousWaitForMs ||
				!hasExistingFile),
		waitForMs,
	}
}

export async function prepareMediaSourceCapture(args: {
	data: MediaMutationData
	operation: "create" | "update"
	originalDoc?: MediaDocLike
	req: PayloadRequest
}) {
	const plan = resolveMediaCapturePlan({
		data: args.data,
		hasUploadedFile: Boolean(args.req.file),
		operation: args.operation,
		originalDoc: args.originalDoc,
	})

	if (hasOwn(args.data, "captureUrl")) {
		args.data.captureUrl = plan.captureUrl ?? null
	}

	if (plan.captureUrl) {
		args.data.captureWaitForMs = plan.waitForMs
	} else if (hasOwn(args.data, "captureUrl")) {
		args.data.captureWaitForMs = null
	}

	if (!plan.captureUrl || !plan.shouldGenerate) {
		return
	}

	args.req.payload.logger.info(
		`Generating media capture for URL ${plan.captureUrl} with wait ${plan.waitForMs}ms`
	)

	const screenshot = await captureScreenshot({
		height: 900,
		logger: args.req.payload.logger,
		url: plan.captureUrl,
		waitForTimeoutMs: plan.waitForMs,
		width: 1600,
	})

	args.req.file = {
		data: screenshot.buffer,
		mimetype: screenshot.contentType,
		name: buildGeneratedFilename("capture", plan.captureUrl, screenshot.contentType),
		size: screenshot.buffer.length,
	}
}

async function findOriginalMediaDoc(
	args: unknown,
	req: PayloadRequest
): Promise<MediaDocLike | undefined> {
	if (!args || typeof args !== "object") {
		return undefined
	}

	const id = "id" in args ? args.id : undefined
	if (typeof id !== "string" && typeof id !== "number") {
		return undefined
	}

	return (await req.payload.findByID({
		collection: "media",
		depth: 0,
		id: id,
		overrideAccess: true,
		req,
	})) as unknown as MediaDocLike
}

export const mediaCaptureBeforeOperation: CollectionBeforeOperationHook = async ({
	args,
	operation,
	req,
}) => {
	if ((req.context as Record<string, unknown> | undefined)?.[SKIP_MEDIA_SOURCE_CAPTURE_FLAG]) {
		return args
	}

	if (operation !== "create" && operation !== "update") {
		return args
	}

	if (!args || typeof args !== "object") {
		return args
	}

	const data =
		"data" in args && args.data && typeof args.data === "object"
			? (args.data as MediaMutationData)
			: {}

	args.data = data

	const originalDoc = operation === "update" ? await findOriginalMediaDoc(args, req) : undefined

	await prepareMediaSourceCapture({
		data,
		operation,
		originalDoc,
		req,
	})

	return args
}
