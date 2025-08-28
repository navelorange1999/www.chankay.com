/**
 * Core translation service interfaces and types
 */

export interface TranslationService {
	translateText(text: string, from: string, to: string): Promise<string>
	translateRichText<T>(content: T, from: string, to: string): Promise<T>
}

export interface TranslationAdapter {
	name: string
	translateText(text: string, from: string, to: string): Promise<string>
	isAvailable(): boolean
	getConfig?(): Record<string, unknown>
}

export interface TranslationConfig {
	provider: TranslationProvider
	adapters?: Record<string, TranslationAdapter>
	fallbackProvider?: TranslationProvider
	maxRetries?: number
	timeout?: number
}

export type TranslationProvider =
	| "mock"
	| "custom"
	| "openai"
	| "deepl"
	| "google"
	| "azure"
	| "baidu"
