/**
 * Re-exports the shared locale configuration from `@repo/i18n` so admin
 * code can keep its existing `@/config/locales` import path.
 *
 * Edit locale data in `packages/i18n/src/config.ts`, not here.
 */
export {
	DEFAULT_LOCALE,
	FALLBACK_LOCALE,
	LOCALE_CONFIG,
	PREFIXED_LOCALES,
	SUPPORTED_LOCALES,
	getLocaleConfig,
	getLocaleOptions,
	isDefaultLocale,
	isSupportedLocale,
	type LocaleConfig,
	type SupportedLocale,
} from "@repo/i18n"
