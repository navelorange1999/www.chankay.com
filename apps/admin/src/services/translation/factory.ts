import type {
	TranslationService,
	TranslationProvider,
	TranslationConfig,
	TranslationAdapter,
} from "./types"
import { UniversalTranslator } from "./universal"
import {
	MockTranslationAdapter,
	OpenAITranslationAdapter,
	DeepLTranslationAdapter,
	GoogleTranslationAdapter,
	BaiduTranslationAdapter,
} from "./adapters"

/**
 * Translation service factory
 * Creates translation service instances using adapters
 */
export function createTranslationService(
	provider: TranslationProvider = "mock",
	config: TranslationConfig = {
		provider: "mock",
	}
): TranslationService {
	const adapter = createTranslationAdapter(provider, config)
	const fallbackAdapter = config.fallbackProvider
		? createTranslationAdapter(config.fallbackProvider, config)
		: new MockTranslationAdapter() // Always fallback to mock

	return new UniversalTranslator(adapter, fallbackAdapter)
}

/**
 * Create a translation adapter based on provider
 */
export function createTranslationAdapter(
	provider: TranslationProvider,
	config: TranslationConfig = {
		provider: "mock",
	}
): TranslationAdapter {
	switch (provider) {
		case "mock":
			return new MockTranslationAdapter()

		case "openai":
			return new OpenAITranslationAdapter()

		case "deepl":
			return new DeepLTranslationAdapter()

		case "google":
			return new GoogleTranslationAdapter()

		case "baidu":
			return new BaiduTranslationAdapter()

		case "custom":
			// Look for custom adapters in config
			if (config.adapters?.custom) {
				return config.adapters.custom
			}
			throw new Error("Custom adapter not provided in config")

		default:
			console.warn(`Unknown translation provider: ${provider}, falling back to mock`)
			return new MockTranslationAdapter()
	}
}

/**
 * Get optimal translation service based on language pair and content type
 */
export function getOptimalTranslationService(
	from: string,
	to: string,
	contentType: "technical" | "general" = "general"
): TranslationProvider {
	// Language pair specific optimizations
	const languagePair = `${from}-${to}`
	const languagePairMap: Record<string, TranslationProvider> = {
		"en-zh-CN": "baidu", // English to Chinese: Baidu is good for Chinese
		"zh-CN-en": "deepl", // Chinese to English: DeepL is generally good
		"ja-en": "deepl", // Japanese to English: DeepL excels at this
		"en-ja": "deepl", // English to Japanese: DeepL excels at this
	}

	if (languagePairMap[languagePair]) {
		return languagePairMap[languagePair]
	}

	// Content type specific optimizations
	if (contentType === "technical") {
		return "openai" // GPT models are better for technical content
	}

	// Default to mock for development, deepl for production
	return process.env.NODE_ENV === "development" ? "mock" : "mock" // Keep mock as default for now
}

/**
 * Create a translation service with multiple adapters for redundancy
 */
export function createRedundantTranslationService(
	primaryProvider: TranslationProvider,
	fallbackProvider: TranslationProvider = "mock"
): TranslationService {
	return createTranslationService(primaryProvider, {
		provider: primaryProvider,
		fallbackProvider,
	})
}
