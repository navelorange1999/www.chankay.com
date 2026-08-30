import type { SupportedLocale } from "./config.js"

export type UiStrings = {
	article: {
		backToPosts: string
		onThisPage: string
	}
	notFound: {
		description: string
		title: string
	}
	posts: {
		description: string
		emptyState: string
		eyebrow: string
		readPost: string
		title: string
	}
	untitledPost: string
}

const UI_STRINGS = {
	en: {
		article: {
			backToPosts: "Back to posts",
			onThisPage: "On this page",
		},
		notFound: {
			description: "The page you are looking for does not exist.",
			title: "404 - Page Not Found",
		},
		posts: {
			description: "Thoughts, experiments, and practical notes from building on the web.",
			emptyState: "No posts yet. Create the first one in Payload Admin and it will appear here.",
			eyebrow: "Notes",
			readPost: "Read post",
			title: "Posts",
		},
		untitledPost: "Untitled post",
	},
	"zh-CN": {
		article: {
			backToPosts: "返回文章列表",
			onThisPage: "本文目录",
		},
		notFound: {
			description: "你访问的页面不存在。",
			title: "404 - 页面未找到",
		},
		posts: {
			description: "记录 Web 开发中的思考、实验与实践。",
			emptyState: "暂无文章。请先在 Payload Admin 中创建并发布文章。",
			eyebrow: "随笔",
			readPost: "阅读文章",
			title: "文章",
		},
		untitledPost: "未命名文章",
	},
} satisfies Record<SupportedLocale, UiStrings>

export function getUiStrings(locale: SupportedLocale): UiStrings {
	return UI_STRINGS[locale]
}
