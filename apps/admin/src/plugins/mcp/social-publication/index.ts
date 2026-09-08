import type { PayloadRequest } from "payload"
import {
	createSocialDraft,
	prepareSocialPublication,
	publishSocialPublication,
} from "@/services/socialPublishing"
import {
	commandParameters,
	commandSchema,
	prepareParameters,
	prepareSchema,
} from "@/services/socialPublishing/validation"
import { safeError } from "@/services/socialPublishing/types"
import { createTextResult } from "../shared"

function handler(
	command: (args: unknown, req: PayloadRequest) => Promise<unknown>,
	schema: { parse: (args: unknown) => unknown }
) {
	return async (args: Record<string, unknown>, req: PayloadRequest) => {
		try {
			return createTextResult(await command(schema.parse(args), req))
		} catch (error) {
			return { ...createTextResult({ error: safeError(error, "prepare") }), isError: true }
		}
	}
}

export const socialPublicationTools = [
	{
		name: "prepare_social_publication",
		description:
			"Prepare an immutable social publication from a published Post and explicit locale. Does not write to the external platform. Review the exact snapshot before creating a draft or publishing.",
		parameters: prepareParameters,
		handler: handler(prepareSocialPublication, prepareSchema),
	},
	{
		name: "create_social_draft",
		description:
			"Create a remote draft for the exact reviewed snapshot. This writes to the account's draft box but does not publish. Repeated calls return current state.",
		parameters: commandParameters,
		handler: handler(createSocialDraft, commandSchema),
	},
	{
		name: "publish_social_publication",
		description:
			"Publish externally. Call ONLY after showing the prepared content, account, locale and snapshot hash to the user and receiving explicit confirmation. Requires an Admin user and the exact reviewed snapshot hash. Repeated calls return current state.",
		parameters: commandParameters,
		handler: handler(publishSocialPublication, commandSchema),
	},
]
