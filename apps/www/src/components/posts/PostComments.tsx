import * as React from "react"

import { getUiStrings, type SupportedLocale } from "@repo/i18n"
import type { Post, SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { PostCommentsSection } from "@repo/ui/components/Post"

import { resolvePostComments } from "@/utils/postComments"
import { PostCommentsClient } from "./PostCommentsClient"

export function PostComments({
	post,
	settings,
	locale,
}: {
	post: Post
	settings: SiteConfig["giscus"] | null | undefined
	locale: SupportedLocale
}) {
	const config = resolvePostComments(post, settings)
	if (!config) return null
	const strings = getUiStrings(locale).article

	return (
		<PostCommentsSection
			title={strings.commentsTitle}
			description={strings.commentsDescription}
			discussionsUrl={config.discussionsUrl}
			linkLabel={strings.commentsLink}
		>
			<PostCommentsClient config={config} locale={locale} />
		</PostCommentsSection>
	)
}
