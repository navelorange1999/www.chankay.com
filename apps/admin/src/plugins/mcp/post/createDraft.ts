import type { Post } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import {
	createTextResult,
	getPayloadInstance,
	requireStringArg,
	resolveSupportedLocale,
} from "../shared"
import { summarizePost } from "./shared"

export const createPostDraftTool = {
	description:
		"Create a new post draft with Markdown content using a narrow, task-oriented input shape.",
	handler: async (args: Record<string, unknown>) => {
		const payload = await getPayloadInstance()
		const content = requireStringArg(args.content, "content")
		const title = requireStringArg(args.title, "title")
		const locale = resolveSupportedLocale(args.locale)
		const createdPost = (await payload.create({
			collection: "posts",
			data: {
				content,
				excerpt: typeof args.excerpt === "string" ? args.excerpt : undefined,
				slug: typeof args.slug === "string" ? args.slug : undefined,
				status: "draft",
				title,
			},
			draft: true,
			locale,
			overrideAccess: true,
		})) as Post

		return createTextResult({
			action: "create_post_draft",
			post: summarizePost(createdPost),
		})
	},
	name: "create_post_draft",
	parameters: {
		content: z.string().min(1),
		excerpt: z.string().optional(),
		locale: z.string().optional(),
		slug: z.string().optional(),
		title: z.string().min(1),
	},
}
