import type { Metadata } from "next"
import Link from "next/link"

import {
	ImageMedia,
	Post,
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

import { getAllPosts, getSiteConfig } from "@/services/payload"
import { resolveTwitterHandle } from "@/utils/seo"
import {
	formatPostDate,
	resolvePostAbsoluteUrl,
	resolvePostExcerpt,
	resolvePostImage,
	resolvePostPath,
	resolvePostTags,
	resolvePostTitle,
} from "@/utils/posts"

export async function generateMetadata(): Promise<Metadata> {
	const siteConfig = await getSiteConfig()
	const title = "Posts"
	const description = "Markdown-first posts, notes, and experiments."
	const canonicalUrl = resolvePostAbsoluteUrl(siteConfig)
	const twitterHandle = resolveTwitterHandle(siteConfig)

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			description,
			title,
			type: "website",
			url: canonicalUrl,
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

export default async function PostsPage() {
	const posts = await getAllPosts()

	return (
		<section className="mx-auto flex max-w-4xl flex-col gap-8">
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
					Writing
				</p>
				<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Posts</h1>
				<p className="max-w-2xl text-base text-muted-foreground md:text-lg">
					Markdown-first articles with code, notes, and media pulled from Payload.
				</p>
			</header>

			{posts.length === 0 ? (
				<div className="rounded-2xl border border-dashed px-6 py-10 text-muted-foreground">
					No posts yet. Create the first one in Payload Admin and it will appear here.
				</div>
			) : (
				<div className="space-y-8">
					{posts.map((post) => {
						const postUrl = resolvePostPath(post.slug)
						const postImage = resolvePostImage(post)
						const postDate = formatPostDate(post.publishedAt || post.updatedAt)
						const postExcerpt = resolvePostExcerpt(post)
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
										<PostTitle className="text-2xl md:text-3xl">
											<Link className="hover:underline" href={postUrl}>
												{resolvePostTitle(post)}
											</Link>
										</PostTitle>

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

										<PostExcerpt className="line-clamp-none text-base">{postExcerpt}</PostExcerpt>
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
