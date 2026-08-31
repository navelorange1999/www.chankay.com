"use client"

import * as React from "react"

import { DEFAULT_LOCALE, getUiStrings, type SupportedLocale, type UiStrings } from "@repo/i18n"

export interface LocaleContextValue {
	locale: SupportedLocale
	strings: UiStrings
}

export interface LocaleProviderProps {
	children: React.ReactNode
	locale: SupportedLocale
}

const defaultLocaleValue: LocaleContextValue = {
	locale: DEFAULT_LOCALE,
	strings: getUiStrings(DEFAULT_LOCALE),
}

const LocaleContext = React.createContext<LocaleContextValue>(defaultLocaleValue)

export function LocaleProvider({ children, locale }: LocaleProviderProps) {
	const value = React.useMemo(() => ({ locale, strings: getUiStrings(locale) }), [locale])

	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
	return React.useContext(LocaleContext)
}
