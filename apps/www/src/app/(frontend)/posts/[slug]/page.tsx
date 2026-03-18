import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
	ImageMedia,
	Post,
	PostContent,
	PostDate,
	PostExcerpt,
	PostHeader,
	PostMetaInline,
	PostMetaSeparator,
	PostReadingTime,
	PostTag,
	PostThumbnail,
	PostTitle,
} from "@repo/ui"

import { getAllPosts, getPostBySlug, getSiteConfig } from "@/services/payload"
import {
	resolveMedia,
	resolveMediaUrl,
	resolveTwitterHandle,
	resolveSiteDescription,
} from "@/utils/seo"
import {
	formatPostDate,
	resolvePostAbsoluteUrl,
	resolvePostExcerpt,
	resolvePostImage,
	resolvePostTags,
	resolvePostTitle,
} from "@/utils/posts"

type PostPageParams = {
	slug: string
}

const getPostBySlugCached = cache(async (slug: string) => {
	return getPostBySlug(slug)
})

export async function generateStaticParams(): Promise<PostPageParams[]> {
	const posts = await getAllPosts()

	return posts
		.filter((post) => Boolean(post.slug))
		.map((post) => ({
			slug: post.slug,
		}))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<PostPageParams>
}): Promise<Metadata> {
	const resolvedParams = await params
	const [post, siteConfig] = await Promise.all([
		getPostBySlugCached(resolvedParams.slug),
		getSiteConfig(),
	])

	if (!post) {
		return {
			title: {
				absolute: "Post Not Found",
			},
			description: resolveSiteDescription(siteConfig),
		}
	}

	const title = resolvePostTitle(post)
	const description = resolvePostExcerpt(post)
	const canonicalUrl = resolvePostAbsoluteUrl(siteConfig, post.slug)
	const ogImageUrl = resolveMediaUrl({
		media: resolvePostImage(post) || resolveMedia(siteConfig.ogImage),
		siteConfig,
	})
	const twitterHandle = resolveTwitterHandle(siteConfig)

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			description,
			images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
			title,
			type: "article",
			url: canonicalUrl,
		},
		twitter: {
			card: ogImageUrl ? "summary_large_image" : "summary",
			creator: twitterHandle,
			description,
			images: ogImageUrl ? [ogImageUrl] : undefined,
			site: twitterHandle,
			title,
		},
	}
}

export default async function PostPage({ params }: { params: Promise<PostPageParams> }) {
	const resolvedParams = await params
	const post = await getPostBySlugCached(resolvedParams.slug)

	if (!post) {
		notFound()
	}

	const postImage = resolvePostImage(post)
	const postDate = formatPostDate(post.publishedAt || post.updatedAt)
	const postExcerpt = post.excerpt?.trim() || post.meta?.description?.trim() || null
	const postTags = resolvePostTags(post)
	const series =
		post.series && typeof post.series === "object" && "title" in post.series
			? post.series.title
			: null
	const hasReadingMeta = Boolean(postDate || post.readingTime)

	return (
		<article className="mx-auto flex max-w-3xl flex-col gap-6">
			<div>
				<Link
					className="text-sm font-medium text-muted-foreground hover:text-foreground"
					href="/posts"
				>
					All posts
				</Link>
			</div>

			<Post className="overflow-hidden border-0 bg-transparent shadow-none">
				{postImage ? (
					<PostThumbnail className="aspect-[16/9] rounded-2xl">
						<ImageMedia
							fill
							priority
							resource={postImage}
							size="(min-width: 1024px) 768px, 100vw"
							imgClassName="object-cover"
						/>
					</PostThumbnail>
				) : null}

				<div className="space-y-8 px-0 py-2">
					<PostHeader className="gap-4">
						<PostTitle className="text-4xl md:text-5xl">{resolvePostTitle(post)}</PostTitle>

						<PostMetaInline>
							{postDate ? <PostDate>{postDate}</PostDate> : null}
							{postDate && post.readingTime ? <PostMetaSeparator /> : null}
							{post.readingTime ? (
								<PostReadingTime>{post.readingTime} min read</PostReadingTime>
							) : null}
							{series && hasReadingMeta ? <PostMetaSeparator /> : null}
							{series ? <span>{series}</span> : null}
							{postTags.map((tag) => (
								<PostTag key={tag.id} variant="outline">
									{tag.name}
								</PostTag>
							))}
						</PostMetaInline>

						{postExcerpt ? (
							<PostExcerpt className="line-clamp-none text-base md:text-lg">
								{postExcerpt}
							</PostExcerpt>
						) : null}
					</PostHeader>

					<PostContent asMarkdown content={post.content} className="px-0 py-0" />
				</div>
			</Post>
		</article>
	)
}
