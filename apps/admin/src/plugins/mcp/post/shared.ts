import type { Post } from "@repo/typescript-config/typings/payload-types"

import { getPayloadInstance } from "../shared"

export const summarizePost = (post: Partial<Post>) => {
	return {
		id: post.id,
		publishedAt: post.publishedAt,
		slug: post.slug,
		status: post.status,
		title: post.title,
		updatedAt: post.updatedAt,
	}
}

export const findPostByIdentifier = async (args: { id?: string; slug?: string }) => {
	const payload = await getPayloadInstance()

	if (args.id) {
		return (await payload.findByID({
			collection: "posts",
			id: args.id,
			overrideAccess: true,
		})) as Post
	}

	if (!args.slug) {
		throw new Error("Either id or slug is required.")
	}

	const result = await payload.find({
		collection: "posts",
		limit: 1,
		overrideAccess: true,
		where: {
			slug: {
				equals: args.slug,
			},
		},
	})

	const post = result.docs[0] as Post | undefined

	if (!post) {
		throw new Error(`Post not found for slug "${args.slug}".`)
	}

	return post
}
