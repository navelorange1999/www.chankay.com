export const LOCALE_CONFIG = {
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
	],
	cms: {
		fallback: true,
	},
	www: {
		defaultLocale: "en",
		fallbackLocale: "en",
	},
} as const

export type LocaleConfig = (typeof LOCALE_CONFIG.locales)[number]
export type SupportedLocale = LocaleConfig["code"]

export const DEFAULT_LOCALE: SupportedLocale = LOCALE_CONFIG.www.defaultLocale
export const FALLBACK_LOCALE: SupportedLocale = LOCALE_CONFIG.www.fallbackLocale
export const SUPPORTED_LOCALES: SupportedLocale[] = LOCALE_CONFIG.locales.map(
	(locale) => locale.code
)
export const PREFIXED_LOCALES: SupportedLocale[] = SUPPORTED_LOCALES.filter(
	(locale) => locale !== DEFAULT_LOCALE
)

export function isSupportedLocale(value: unknown): value is SupportedLocale {
	return typeof value === "string" && (SUPPORTED_LOCALES as string[]).includes(value)
}

export function isDefaultLocale(value: SupportedLocale): boolean {
	return value === DEFAULT_LOCALE
}

export function getLocaleConfig(code: string): LocaleConfig | undefined {
	return LOCALE_CONFIG.locales.find((locale) => locale.code === code)
}

export function getLocaleOptions(): { label: string; value: SupportedLocale }[] {
	return LOCALE_CONFIG.locales.map((locale) => ({
		label: `${locale.flag} ${locale.name}`,
		value: locale.code,
	}))
}
