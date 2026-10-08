export type LegacyPostTaxonomy = {
	id: string
	category: string | null
	primaryTag: string | null
	tags: readonly string[]
}

export type TaxonomyPlan = {
	id: string
	category: string | null
	tags: string[]
	changed: boolean
	reviewReason?: string
}

export function planPostTaxonomy(post: LegacyPostTaxonomy, categoryByTagId: Readonly<Record<string, string>>): TaxonomyPlan {
	const originalTags = [...post.tags]
	const primaryCategory = post.primaryTag ? categoryByTagId[post.primaryTag] : undefined
	const mappedCategories = new Set(originalTags.map((tagId) => categoryByTagId[tagId]).filter((id): id is string => Boolean(id)))
	const chosenCategory = post.category ?? primaryCategory ?? (mappedCategories.size === 1 ? [...mappedCategories][0] : null)
	if (mappedCategories.size > 1 && !primaryCategory && !post.category) {
		return { id: post.id, category: post.category, tags: originalTags, changed: false, reviewReason: "Multiple Category mappings require editorial selection." }
	}
	if (post.category && primaryCategory && post.category !== primaryCategory) {
		return { id: post.id, category: post.category, tags: originalTags, changed: false, reviewReason: "Existing Category conflicts with the primary Tag mapping." }
	}

	const tags = [...new Set(originalTags)]
	if (post.primaryTag && !categoryByTagId[post.primaryTag] && !tags.includes(post.primaryTag)) tags.push(post.primaryTag)
	const remainingTags = tags.filter((tagId) => !categoryByTagId[tagId] || categoryByTagId[tagId] !== chosenCategory)
	const changed = chosenCategory !== post.category || remainingTags.length !== originalTags.length ||
		remainingTags.some((tagId, index) => tagId !== originalTags[index])
	return { id: post.id, category: chosenCategory ?? null, tags: remainingTags, changed }
}
