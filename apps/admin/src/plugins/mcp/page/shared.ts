import type { Page } from "@repo/typescript-config/typings/payload-types"

import { getPayloadInstance } from "../shared"

export const summarizePage = (page: Partial<Page>) => {
	return {
		id: page.id,
		slug: page.slug,
		status: page.status,
		title: page.title,
		updatedAt: page.updatedAt,
	}
}

export const findPageByIdentifier = async (args: { id?: string; slug?: string }) => {
	const payload = await getPayloadInstance()

	if (args.id) {
		return (await payload.findByID({
			collection: "pages",
			id: args.id,
			overrideAccess: true,
		})) as Page
	}

	if (!args.slug) {
		throw new Error("Either id or slug is required.")
	}

	const result = await payload.find({
		collection: "pages",
		limit: 1,
		overrideAccess: true,
		where: {
			slug: {
				equals: args.slug,
			},
		},
	})

	const page = result.docs[0] as Page | undefined

	if (!page) {
		throw new Error(`Page not found for slug "${args.slug}".`)
	}

	return page
}
