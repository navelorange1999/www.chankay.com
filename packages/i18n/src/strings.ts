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
