/**
 * Centralized locale configuration for i18n
 * Avoids hardcoding language codes throughout the application
 */

export const LOCALE_CONFIG = {
	// Supported languages list
	locales: [
		{
			code: "en",
			name: "English",
			flag: "🇺🇸",
			rtl: false,
		},
		{
			code: "zh-CN",
			name: "简体中文",
			flag: "🇨🇳",
			rtl: false,
		},
		// Future expansion ready
		// {
		//   code: 'ja',
		//   name: '日本語',
		//   flag: '🇯🇵',
		//   rtl: false,
		// },
	] as const,

	// CMS configuration: No forced default locale for flexible content creation
	cms: {
		fallback: true,
	},

	// WWW frontend configuration: Default to English for public display
	www: {
		defaultLocale: "en",
		fallbackLocale: "en",
	},
} as const

export type SupportedLocale = (typeof LOCALE_CONFIG.locales)[number]["code"]
export const SUPPORTED_LOCALES = LOCALE_CONFIG.locales.map((l) => l.code)

/**
 * Get locale configuration by code
 */
export function getLocaleConfig(code: SupportedLocale) {
	return LOCALE_CONFIG.locales.find((locale) => locale.code === code)
}

/**
 * Get all locale options for select fields
 */
export function getLocaleOptions() {
	return LOCALE_CONFIG.locales.map((locale) => ({
		label: `${locale.flag} ${locale.name}`,
		value: locale.code,
	}))
}
