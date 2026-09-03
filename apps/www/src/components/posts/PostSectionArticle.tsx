import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
	buildRouteAlternates,
	formatReadingTime,
	getUiStrings,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "@repo/i18n"

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
import { getPostBySlugForSection, getPostsBySection } from "@/services/payload/posts"
import { getSiteConfig } from "@/services/payload/site-config"
import { resolveMedia, resolveMediaUrl, resolveSiteUrl, resolveTwitterHandle } from "@/utils/seo"
import {
	formatPostDate,
	resolvePostDisplayExcerpt,
	resolvePostDisplayTitle,
	resolvePostImage,
	resolvePostSeoDescription,
	resolvePostSeoTitle,
	resolvePostTags,
} from "@/utils/posts"
import { POST_SECTIONS, resolvePostSectionPath, type PostSection } from "@/utils/postSections"

export type PostSectionArticleParams = {
	locale: SupportedLocale
	slug: string
}

const getPostBySlugForSectionCached = cache(
	async (slug: string, section: PostSection, locale: SupportedLocale) => {
		return getPostBySlugForSection(slug, section, { locale })
	}
)

export async function buildPostSectionStaticParams(
	section: PostSection
): Promise<PostSectionArticleParams[]> {
	const params: PostSectionArticleParams[] = []
	for (const locale of SUPPORTED_LOCALES) {
		const posts = await getPostsBySection(section, { locale })
		for (const post of posts) {
			if (post.slug) {
				params.push({ locale, slug: post.slug })
			}
		}
	}
	return params
}

export async function buildPostSectionArticleMetadata(
	section: PostSection,
	locale: SupportedLocale,
	slug: string
): Promise<Metadata> {
	const [post, siteConfig] = await Promise.all([
		getPostBySlugForSectionCached(slug, section, locale),
		getSiteConfig(locale),
	])

	if (!post) {
		const strings = getUiStrings(locale).notFound
		return {
			title: { absolute: strings.title },
			description: strings.description,
		}
	}

	const title = resolvePostSeoTitle(post, locale)
	const description = resolvePostSeoDescription(post, siteConfig)
	const alternates = buildRouteAlternates({
		currentLocale: locale,
		domain: POST_SECTIONS[section].domain,
		siteUrl: resolveSiteUrl(siteConfig),
		slug: post.slug,
	})
	const ogImageUrl = resolveMediaUrl({
		media: resolvePostImage(post) || resolveMedia(siteConfig.ogImage),
		siteConfig,
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
			images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
			title,
			type: "article",
			url: alternates.canonical,
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

export async function PostSectionArticle({
	locale,
	section,
	slug,
}: PostSectionArticleParams & { section: PostSection }) {
	const post = await getPostBySlugForSectionCached(slug, section, locale)
	const strings = getUiStrings(locale)

	if (!post) {
		notFound()
	}

	const sectionHref = resolvePostSectionPath(section, undefined, locale)
	const postImage = resolvePostImage(post)
	const postDate = formatPostDate(post.publishedAt || post.updatedAt, locale)
	const postExcerpt = resolvePostDisplayExcerpt(post) || null
	const postTitle = resolvePostDisplayTitle(post, locale)
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
			<Link aria-label={strings.article.backToSection} href={sectionHref}>
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
									<Link aria-label={strings.article.backToSection} href={sectionHref}>
										<ArrowLeft className="h-4 w-4" />
									</Link>
								</Button>

								{tocHeadings.length > 0 ? (
									<PostTocDrawerClient title={strings.article.onThisPage}>
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
										<PostReadingTime>{formatReadingTime(post.readingTime, locale)}</PostReadingTime>
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
