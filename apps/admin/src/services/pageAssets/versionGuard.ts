import type { CollectionBeforeChangeHook } from "payload"

import { EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY, GENERATION_CONTEXT_FLAG } from "./constants"
import { asRecord } from "./utils"

export const rejectStalePageAssetUpdate: CollectionBeforeChangeHook = ({
	data,
	originalDoc,
	req,
}) => {
	const context = asRecord(req.context)
	if (context[GENERATION_CONTEXT_FLAG] !== true) return data
	const expectedUpdatedAt = context[EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY]
	if (
		typeof expectedUpdatedAt !== "string" ||
		!expectedUpdatedAt ||
		originalDoc?.updatedAt !== expectedUpdatedAt
	) {
		throw new Error("Page changed before generated assets could be saved")
	}
	return data
}
