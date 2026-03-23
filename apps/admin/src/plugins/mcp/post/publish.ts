import type { Post } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { createTextResult, getPayloadInstance } from "../shared"
import { findPostByIdentifier, summarizePost } from "./shared"

export const publishPostTool = {
	description: "Publish an existing post by id or slug without exposing the generic update tool.",
	handler: async (args: Record<string, unknown>) => {
		const existingPost = await findPostByIdentifier({
			id: typeof args.id === "string" ? args.id : undefined,
			slug: typeof args.slug === "string" ? args.slug : undefined,
		})
		const payload = await getPayloadInstance()
		const updatedPost = (await payload.update({
			collection: "posts",
			data: {
				publishedAt: existingPost.publishedAt || new Date().toISOString(),
				status: "published",
			},
			id: existingPost.id,
			overrideAccess: true,
		})) as Post

		return createTextResult({
			action: "publish_post",
			post: summarizePost(updatedPost),
		})
	},
	name: "publish_post",
	parameters: {
		id: z.string().optional(),
		slug: z.string().optional(),
	},
}
