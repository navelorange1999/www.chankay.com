import type { Metadata } from "next"
import Link from "next/link"

import { buildRouteIndexAlternates, type SupportedLocale } from "@repo/i18n"

import { ImageMedia } from "@repo/ui/components/Media"
import {
	Post,
	PostDate,
	PostExcerpt,
	PostHeader,
	PostMetaInline,
	PostMetaSeparator,
	PostReadingTime,
	PostTag,
	PostThumbnail,
} from "@repo/ui/components/Post"

import { getAllPosts } from "@/services/payload/posts"
import { getSiteConfig } from "@/services/payload/site-config"
import { resolveSiteUrl, resolveTwitterHandle } from "@/utils/seo"
import {
	formatPostDate,
	resolvePostDisplayExcerpt,
	resolvePostDisplayTitle,
	resolvePostImage,
	resolvePostPath,
	resolvePostTags,
} from "@/utils/posts"

type PostsIndexParams = { locale: SupportedLocale }

export async function generateMetadata({
	params,
}: {
	params: Promise<PostsIndexParams>
}): Promise<Metadata> {
	const { locale } = await params
	const siteConfig = await getSiteConfig(locale)
	const title = "Posts"
	const description = "Thoughts, experiments, and practical notes from building on the web."
	const alternates = buildRouteIndexAlternates({
		currentLocale: locale,
		domain: "posts",
		siteUrl: resolveSiteUrl(siteConfig),
	})
	const twitterHandle = resolveTwitterHandle(siteConfig)

	return {
		title,
		description,
		alternates: {
			canonical: alternates.canonical,
			languages: alternates.languages,
		},
		openGraph: {
			description,
			title,
			type: "website",
			url: alternates.canonical,
		},
		twitter: {
			card: "summary",
			creator: twitterHandle,
			description,
			site: twitterHandle,
			title,
		},
	}
}

export default async function PostsPage({ params }: { params: Promise<PostsIndexParams> }) {
	const { locale } = await params
	const posts = await getAllPosts({ locale })

	return (
		<section className="mx-auto flex max-w-4xl flex-col gap-8">
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
					Notes
				</p>
				<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Posts</h1>
				<p className="max-w-2xl text-base text-muted-foreground md:text-lg">
					Thoughts, experiments, and practical notes from building on the web.
				</p>
			</header>

			{posts.length === 0 ? (
				<div className="rounded-2xl border border-dashed px-6 py-10 text-muted-foreground">
					No posts yet. Create the first one in Payload Admin and it will appear here.
				</div>
			) : (
				<div className="space-y-8">
					{posts.map((post) => {
						const postUrl = resolvePostPath(post.slug, locale)
						const postImage = resolvePostImage(post)
						const postDate = formatPostDate(post.publishedAt || post.updatedAt)
						const postExcerpt = resolvePostDisplayExcerpt(post)
						const postTitle = resolvePostDisplayTitle(post)
						const postTags = resolvePostTags(post)

						return (
							<Post key={post.id} className="overflow-hidden">
								{postImage ? (
									<PostThumbnail className="aspect-[16/8]">
										<ImageMedia
											fill
											priority={false}
											resource={postImage}
											size="(min-width: 1024px) 896px, 100vw"
											imgClassName="object-cover"
										/>
									</PostThumbnail>
								) : null}

								<div className="space-y-4 px-6 py-6">
									<PostHeader>
										<strong className="block">
											<Link className="text-[1.0625rem] hover:underline" href={postUrl}>
												{postTitle}
											</Link>
										</strong>

										<PostMetaInline>
											{postDate ? <PostDate>{postDate}</PostDate> : null}
											{postDate && post.readingTime ? <PostMetaSeparator /> : null}
											{post.readingTime ? (
												<PostReadingTime>{post.readingTime} min read</PostReadingTime>
											) : null}
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
												className="line-clamp-none text-base"
											/>
										) : null}
									</PostHeader>

									<div>
										<Link
											className="text-sm font-medium text-primary hover:underline"
											href={postUrl}
										>
											Read post
										</Link>
									</div>
								</div>
							</Post>
						)
					})}
				</div>
			)}
		</section>
	)
}
