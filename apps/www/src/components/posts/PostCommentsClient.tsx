"use client"

import * as React from "react"
import Giscus from "@giscus/react"

import type { SupportedLocale } from "@repo/i18n"
import { useTheme } from "@repo/ui/hooks/useTheme"

import type { PostCommentsConfig } from "@/utils/postComments"

export function PostCommentsClient({
	config,
	locale,
}: {
	config: PostCommentsConfig
	locale: SupportedLocale
}) {
	const { mounted, resolvedTheme } = useTheme()
	if (!mounted) return null
	const theme = `${window.location.origin}/giscus/theme-${resolvedTheme === "dark" ? "dark" : "light"}.css`

	return (
		<Giscus
			key={`${config.repoId}:${config.term}`}
			id="post-giscus"
			repo={config.repo}
			repoId={config.repoId}
			category={config.category}
			categoryId={config.categoryId}
			mapping="specific"
			term={config.term}
			strict="1"
			reactionsEnabled="1"
			emitMetadata="0"
			inputPosition="top"
			theme={theme}
			lang={locale === "zh-CN" ? "zh-CN" : "en"}
			loading="lazy"
		/>
	)
}
