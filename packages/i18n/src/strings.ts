import type { SupportedLocale } from "./config.js"

export type UiStrings = {
	accessibility: {
		closeLanguageMenu: string
		closeThemeMenu: string
		followOn: string
		home: string
		selectLanguage: string
		selectTheme: string
		toggleMobileMenu: string
		toggleTheme: string
		websiteLogo: string
	}
	article: {
		backToSection: string
		commentsLink: string
		commentsDescription: string
		commentsTitle: string
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
	topicMap: {
		uncategorized: string
		untagged: string
		otherTopics: string
		viewData: string
		allCategories: string
		articles: string
		uniqueArticles: string
		tagUsages: string
		loading: string
		empty: string
		unavailable: string
		emptyMap: string
		unavailableMap: string
		retry: string
		close: string
		previous: string
		next: string
		metricExplanation: string
	}
	untitledPost: string
}

const UI_STRINGS = {
	en: {
		accessibility: {
			closeLanguageMenu: "Close language menu",
			closeThemeMenu: "Close theme menu",
			followOn: "Follow us on {platform}",
			home: "Home",
			selectLanguage: "Select language",
			selectTheme: "Select theme",
			toggleMobileMenu: "Toggle mobile menu",
			toggleTheme: "Toggle theme",
			websiteLogo: "Website logo",
		},
		article: {
			backToSection: "Back to section",
			commentsLink: "View discussions on GitHub",
			commentsDescription:
				"Sign in with GitHub to comment. All language versions share this discussion.",
			commentsTitle: "Discussion",
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
		topicMap: {
			uncategorized: "Uncategorized",
			untagged: "Untagged",
			otherTopics: "Other topics",
			viewData: "View data",
			allCategories: "All categories",
			articles: "Articles",
			uniqueArticles: "Unique articles",
			tagUsages: "Tag uses",
			loading: "Loading articles…",
			empty: "No published articles match this topic.",
			unavailable: "Articles are temporarily unavailable.",
			emptyMap: "No published topics to display.",
			unavailableMap: "Topic map is temporarily unavailable.",
			retry: "Retry",
			close: "Close",
			previous: "Previous",
			next: "Next",
			metricExplanation:
				"Tile area counts tag uses. One article can count toward multiple tags; an untagged article counts once.",
		},
		untitledPost: "Untitled post",
	},
	"zh-CN": {
		accessibility: {
			closeLanguageMenu: "关闭语言菜单",
			closeThemeMenu: "关闭主题菜单",
			followOn: "在 {platform} 上关注我们",
			home: "首页",
			selectLanguage: "选择语言",
			selectTheme: "选择主题",
			toggleMobileMenu: "切换移动端菜单",
			toggleTheme: "切换主题",
			websiteLogo: "网站标志",
		},
		article: {
			backToSection: "返回板块",
			commentsLink: "在 GitHub 查看讨论",
			commentsDescription: "登录 GitHub 即可评论。同一篇文章的不同语言版本共用此讨论区。",
			commentsTitle: "讨论",
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
		topicMap: {
			uncategorized: "未分类",
			untagged: "无标签",
			otherTopics: "其他主题",
			viewData: "查看数据",
			allCategories: "全部分类",
			articles: "文章",
			uniqueArticles: "文章数（去重）",
			tagUsages: "标签使用次数",
			loading: "正在加载文章…",
			empty: "这个主题下暂无已发布文章。",
			unavailable: "文章暂时无法加载。",
			emptyMap: "暂无可展示的已发布主题。",
			unavailableMap: "主题图暂时无法加载。",
			retry: "重试",
			close: "关闭",
			previous: "上一页",
			next: "下一页",
			metricExplanation: "区块面积表示标签使用次数。一篇文章可以计入多个标签；无标签文章计入一次。",
		},
		untitledPost: "未命名文章",
	},
} satisfies Record<SupportedLocale, UiStrings>

export function getUiStrings(locale: SupportedLocale): UiStrings {
	return UI_STRINGS[locale]
}
