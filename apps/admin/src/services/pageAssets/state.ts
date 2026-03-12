import { getPayload } from "payload"
import type { PayloadRequest } from "payload"
import configPromise from "@payload-config"

import { GENERATION_CONTEXT_FLAG } from "./constants"
import type { MaybeDoc, PageAssetsRuntime } from "./types"
import { asRecord } from "./utils"

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
	id: string
	runtime: PageAssetsRuntime
}) {
	return (await args.runtime.payload.update({
		collection: "pages",
		context: buildGenerationContext({
			context: args.runtime.context,
			extra: args.context,
		}),
		data: args.data,
		depth: 1,
		id: args.id,
		overrideAccess: true,
		req: args.runtime.request,
	})) as unknown as MaybeDoc
}
