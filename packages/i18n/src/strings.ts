import type { SupportedLocale } from "./config.js"

export type UiStrings = {
	article: {
		backToSection: string
		onThisPage: string
	}
	notFound: {
		description: string
		title: string
	}
	postSection: {
		emptyState: string
		eyebrow: string
		readPost: string
	}
	untitledPost: string
}

const UI_STRINGS = {
	en: {
		article: {
			backToSection: "Back to section",
			onThisPage: "On this page",
		},
		notFound: {
			description: "The page you are looking for does not exist.",
			title: "404 - Page Not Found",
		},
		postSection: {
			emptyState: "No published articles in this section yet.",
			eyebrow: "Writing",
			readPost: "Read article",
		},
		untitledPost: "Untitled post",
	},
	"zh-CN": {
		article: {
			backToSection: "返回板块",
			onThisPage: "本文目录",
		},
		notFound: {
			description: "你访问的页面不存在。",
			title: "404 - 页面未找到",
		},
		postSection: {
			emptyState: "该板块暂无已发布文章。",
			eyebrow: "文章",
			readPost: "阅读文章",
		},
		untitledPost: "未命名文章",
	},
} satisfies Record<SupportedLocale, UiStrings>

export function getUiStrings(locale: SupportedLocale): UiStrings {
	return UI_STRINGS[locale]
}
