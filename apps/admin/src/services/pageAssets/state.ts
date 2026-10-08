import { getPayload } from "payload"
import type { PayloadRequest } from "payload"
import configPromise from "@payload-config"

import { EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY, GENERATION_CONTEXT_FLAG } from "./constants"
import type { MaybeDoc, PageAssetsRuntime } from "./types"
import { asOptionalString, asRecord } from "./utils"

function buildGenerationContext(args: {
	context?: Record<string, unknown>
	extra?: Record<string, unknown>
}) {
	return {
		...(args.context || {}),
		...(args.extra || {}),
		[GENERATION_CONTEXT_FLAG]: true,
	}
}

export async function createPageAssetsRuntime(req?: PayloadRequest): Promise<PageAssetsRuntime> {
	if (req) {
		return {
			context: asRecord(req.context),
			logger: req.payload.logger,
			payload: req.payload,
			request: req,
		}
	}

	const payload = await getPayload({
		config: configPromise,
	})

	return {
		context: {},
		logger: payload.logger,
		payload,
	}
}

export async function updatePageWithGenerationContext(args: {
	context?: Record<string, unknown>
	data: Record<string, unknown>
	expectedUpdatedAt: string
	id: string
	runtime: PageAssetsRuntime
}) {
	const expectedUpdatedAt = asOptionalString(args.expectedUpdatedAt)
	if (!expectedUpdatedAt || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
		throw new Error("A current Page version is required for generated asset updates")
	}
	return (await args.runtime.payload.update({
		collection: "pages",
		draft: true,
		context: buildGenerationContext({
			context: args.runtime.context,
			extra: {
				...args.context,
				[EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY]: expectedUpdatedAt,
			},
		}),
		data: { ...args.data, _status: "draft" },
		depth: 1,
		id: args.id,
		overrideAccess: true,
		req: args.runtime.request,
	})) as unknown as MaybeDoc
}
