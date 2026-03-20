import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@repo/ui/components/Button"
import { createMarkdownDocument } from "@repo/ui/components/Markdown"
import { ImageMedia } from "@repo/ui/components/Media"
import {
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
	PostToc,
	PostTocLayout,
	PostReadingProgress,
} from "@repo/ui/components/Post"

import { PostTocDrawerClient } from "@/components/lazy/PostTocDrawerClient"
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
	resolvePostDisplayExcerpt,
	resolvePostImage,
	resolvePostSeoDescription,
	resolvePostSeoTitle,
	resolvePostTags,
	resolvePostDisplayTitle,
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

	const title = resolvePostSeoTitle(post)
	const description = resolvePostSeoDescription(post)
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
	const postExcerpt = resolvePostDisplayExcerpt(post) || null
	const postTitle = resolvePostDisplayTitle(post)
	const postTags = resolvePostTags(post)
	const postDocument = createMarkdownDocument(post.content)
	const tocHeadings = postDocument.headings.filter((heading) => [2, 3].includes(heading.level))
	const series =
		post.series && typeof post.series === "object" && "title" in post.series
			? post.series.title
			: null
	const hasReadingMeta = Boolean(postDate || post.readingTime)
	const postReadingTargetId = "post-reading-target"
	const desktopBackButton = (
		<Button
			asChild
			size="icon"
			variant="outline"
			className="rounded-lg text-foreground/70 hover:text-foreground"
		>
			<Link aria-label="Back to posts" href="/posts">
				<ArrowLeft className="h-4 w-4" />
			</Link>
		</Button>
	)

	return (
		<article className="flex w-full flex-col gap-6">
			<PostReadingProgress targetId={postReadingTargetId} />

			<Post className="border-0 bg-transparent shadow-none">
				<div className="space-y-8 px-0 py-2">
					<PostTocLayout headings={tocHeadings} startAside={desktopBackButton}>
						<div id={postReadingTargetId} className="w-full min-w-0 space-y-8">
							<div className="sticky top-[calc(var(--navbar-height,4rem)+0.75rem)] z-20 flex items-center justify-between py-1 lg:hidden">
								<Button
									asChild
									size="icon"
									variant="outline"
									className="rounded-lg text-foreground/70 hover:text-foreground"
								>
									<Link aria-label="Back to posts" href="/posts">
										<ArrowLeft className="h-4 w-4" />
									</Link>
								</Button>

								{tocHeadings.length > 0 ? (
									<PostTocDrawerClient title="On this page">
										<PostToc headings={tocHeadings} showTitle={false} />
									</PostTocDrawerClient>
								) : (
									<div className="h-9 w-9" aria-hidden="true" />
								)}
							</div>

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

							<PostHeader className="gap-4">
								<div className="space-y-3">
									<PostTitle className="text-4xl md:text-5xl">{postTitle}</PostTitle>
								</div>

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
									<PostExcerpt
										asMarkdown
										content={postExcerpt}
										className="line-clamp-none text-base md:text-lg"
									/>
								) : null}
							</PostHeader>

							<PostContent
								asMarkdown
								content={post.content}
								html={postDocument.html}
								className="px-0 py-0"
							/>
						</div>
					</PostTocLayout>
				</div>
			</Post>
		</article>
	)
}
