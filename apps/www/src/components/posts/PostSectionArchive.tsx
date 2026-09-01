import type { Metadata } from "next"
import Link from "next/link"
import * as React from "react"

import {
	buildRouteIndexAlternates,
	formatReadingTime,
	getUiStrings,
	type SupportedLocale,
} from "@repo/i18n"

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

import { getPostsBySection } from "@/services/payload/posts"
import { getSiteConfig } from "@/services/payload/site-config"
import { getTagBySlug } from "@/services/payload/tags"
import { resolveSiteUrl, resolveTwitterHandle } from "@/utils/seo"
import {
	formatPostDate,
	resolvePostDisplayExcerpt,
	resolvePostDisplayTitle,
	resolvePostImage,
	resolvePostTags,
} from "@/utils/posts"
import { POST_SECTIONS, resolvePostSectionPath, type PostSection } from "@/utils/postSections"

export type PostSectionPageParams = { locale: SupportedLocale }

export async function buildPostSectionIndexMetadata(
	section: PostSection,
	locale: SupportedLocale
): Promise<Metadata> {
	const [tag, siteConfig] = await Promise.all([
		getTagBySlug(POST_SECTIONS[section].tagSlug, { locale }),
		getSiteConfig(locale),
	])
	const title = tag?.name || section
	const description = tag?.description || ""
	const alternates = buildRouteIndexAlternates({
		currentLocale: locale,
		domain: POST_SECTIONS[section].domain,
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

export async function PostSectionArchive({
	locale,
	section,
}: PostSectionPageParams & { section: PostSection }) {
	const [posts, tag] = await Promise.all([
		getPostsBySection(section, { locale }),
		getTagBySlug(POST_SECTIONS[section].tagSlug, { locale }),
	])
	const strings = getUiStrings(locale).postSection
	const title = tag?.name || section
	const description = tag?.description || ""

	return (
		<section className="mx-auto flex max-w-4xl flex-col gap-8">
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
					{strings.eyebrow}
				</p>
				<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
				{description ? (
					<p className="max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
				) : null}
			</header>

			{posts.length === 0 ? (
				<div className="rounded-2xl border border-dashed px-6 py-10 text-muted-foreground">
					{strings.emptyState}
				</div>
			) : (
				<div className="space-y-8">
					{posts.map((post) => {
						const postUrl = resolvePostSectionPath(section, post.slug, locale)
						const postImage = resolvePostImage(post)
						const postDate = formatPostDate(post.publishedAt || post.updatedAt, locale)
						const postExcerpt = resolvePostDisplayExcerpt(post)
						const postTitle = resolvePostDisplayTitle(post, locale)
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
												<PostReadingTime>
													{formatReadingTime(post.readingTime, locale)}
												</PostReadingTime>
											) : null}
											{postTags.map((postTag) => (
												<PostTag key={postTag.id} variant="outline">
													{postTag.name}
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
											{strings.readPost}
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
