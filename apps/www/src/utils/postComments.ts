import type { Post, SiteConfig } from "@repo/typescript-config/typings/payload-types"

export function resolvePostComments(
	post: Pick<Post, "id" | "status" | "_status" | "commentsEnabled">,
	settings: SiteConfig["giscus"] | null | undefined
) {
	if (
		post.commentsEnabled === false ||
		post.status !== "published" ||
		(post._status != null && post._status !== "published") ||
		!settings?.enabled
	)
		return null

	const { repo, repoId, category, categoryId } = settings
	if (
		!repo ||
		!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
		repo.endsWith("/..") ||
		repo.endsWith("/.") ||
		!repoId ||
		!/^R_[A-Za-z0-9_-]{1,100}$/.test(repoId) ||
		!category?.trim() ||
		category.length > 100 ||
		!categoryId ||
		!/^DIC_[A-Za-z0-9_-]{1,100}$/.test(categoryId) ||
		!post.id ||
		!/^[A-Za-z0-9_-]{1,128}$/.test(post.id)
	)
		return null

	const term = `post:${post.id}`
	const query = new URLSearchParams({ discussions_q: `"${term}"` })
	return {
		repo: repo as `${string}/${string}`,
		repoId,
		category,
		categoryId,
		term,
		discussionsUrl: `https://github.com/${repo}/discussions?${query}`,
	}
}

export type PostCommentsConfig = NonNullable<ReturnType<typeof resolvePostComments>>
