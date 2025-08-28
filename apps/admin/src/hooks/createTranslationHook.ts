import type { CollectionBeforeChangeHook } from "payload"
import { createTranslationService, getOptimalTranslationService } from "../services/translation"
import {
	detectLocalizedFields,
	pathUtils,
	hasMissingTranslations,
} from "../services/translation/detector"
import { SUPPORTED_LOCALES } from "../config/locales"

export interface TranslationHookOptions {
	// Optional: Specify fields to translate, if not specified auto-detects all localized fields
	fields?: string[]

	// Optional: Specify translation service provider
	translationService?: "openai" | "mock" | "deepl" | "google"

	// Optional: Custom trigger condition for when to translate
	triggerCondition?: (data: Record<string, unknown>, operation: string) => boolean

	// Optional: Translation status field name for tracking
	statusFieldName?: string

	// Optional: Content type for optimal service selection
	contentType?: "technical" | "general"

	// Optional: Enable/disable automatic translation
	enableAutoTranslation?: boolean
}

/**
 * Creates a generic translation hook that can be used with any collection
 * Automatically detects localized fields and translates missing content
 */
export function createTranslationHook(
	options: TranslationHookOptions = {}
): CollectionBeforeChangeHook {
	const {
		fields,
		translationService,
		triggerCondition,
		statusFieldName = "translationStatus",
		contentType = "general",
		enableAutoTranslation = true,
	} = options

	return async ({ data, operation }) => {
		// Skip if auto-translation is disabled
		if (!enableAutoTranslation) return

		// Check custom trigger condition
		if (triggerCondition && !triggerCondition(data, operation)) {
			return
		}

		// Default trigger: only on create or update operations
		if (!["create", "update"].includes(operation)) {
			return
		}

		// Get primary language (fallback to first supported locale)
		const primaryLanguage = data.primaryLanguage || SUPPORTED_LOCALES[0]
		const targetLanguages = SUPPORTED_LOCALES.filter((lang) => lang !== primaryLanguage)

		// Determine fields to translate
		const fieldsToTranslate = fields || detectLocalizedFields(data).map((f) => f.path)

		if (fieldsToTranslate.length === 0) {
			return // No localized fields found
		}

		// Check if any translations are missing
		if (!hasMissingTranslations(data, fieldsToTranslate, primaryLanguage)) {
			return // All translations are present
		}

		// Get optimal translation service
		const serviceProvider =
			translationService ||
			getOptimalTranslationService(primaryLanguage, targetLanguages[0] || "zh-CN", contentType)

		const translator = createTranslationService(serviceProvider)

		console.log(
			`[Translation] Auto-translating ${fieldsToTranslate.length} fields from ${primaryLanguage} to [${targetLanguages.join(", ")}]`
		)

		// Process each target language
		for (const targetLang of targetLanguages) {
			await translateFieldsForLanguage({
				data,
				fieldsToTranslate,
				fromLang: primaryLanguage,
				toLang: targetLang,
				translator,
				statusFieldName,
			})
		}
	}
}

/**
 * Translates all specified fields for a target language
 */
async function translateFieldsForLanguage({
	data,
	fieldsToTranslate,
	fromLang,
	toLang,
	translator,
	statusFieldName,
}: {
	data: Record<string, unknown>
	fieldsToTranslate: string[]
	fromLang: string
	toLang: string
	translator: ReturnType<typeof createTranslationService>
	statusFieldName: string
}) {
	let hasTranslated = false

	for (const fieldPath of fieldsToTranslate) {
		try {
			const sourceValuePath = `${fieldPath}.${fromLang}`
			const targetValuePath = `${fieldPath}.${toLang}`

			const sourceValue = pathUtils.getValue(data, sourceValuePath)
			const targetValue = pathUtils.getValue(data, targetValuePath)

			// Only translate if source exists and target is missing
			if (sourceValue && !targetValue) {
				const fieldInfo = detectLocalizedFields({
					[fieldPath]: pathUtils.getValue(data, fieldPath),
				})[0]

				let translatedValue: unknown

				if (fieldInfo?.type === "richText") {
					translatedValue = await translator.translateRichText(sourceValue, fromLang, toLang)
				} else if (typeof sourceValue === "string") {
					translatedValue = await translator.translateText(sourceValue, fromLang, toLang)
				} else {
					console.warn(`[Translation] Unsupported field type for ${fieldPath}`)
					continue
				}

				// Set the translated value
				pathUtils.setValue(data, targetValuePath, translatedValue)
				hasTranslated = true

				console.log(
					`[Translation] Translated ${fieldPath}: "${String(sourceValue).substring(0, 50)}..." -> "${String(translatedValue).substring(0, 50)}..."`
				)
			}
		} catch (error) {
			console.error(
				`[Translation] Failed to translate ${fieldPath} (${fromLang} -> ${toLang}):`,
				error
			)
		}
	}

	// Update translation status if any translations were made
	if (hasTranslated && statusFieldName) {
		updateTranslationStatus(data, toLang, statusFieldName)
	}
}

/**
 * Updates the translation status for a language
 */
function updateTranslationStatus(
	data: Record<string, unknown>,
	language: string,
	statusFieldName: string
): void {
	const statusKey = language.replace("-", "") // Convert 'zh-CN' to 'zhCN'

	if (!data[statusFieldName]) {
		data[statusFieldName] = {}
	}

	const statusObj = data[statusFieldName] as Record<string, unknown>
	statusObj[statusKey] = "auto"
}

/**
 * Creates a simple translation hook with minimal configuration
 * Good for basic use cases
 */
export function createBasicTranslationHook(): CollectionBeforeChangeHook {
	return createTranslationHook({
		enableAutoTranslation: true,
		translationService: "mock", // Safe for development
	})
}

/**
 * Creates an advanced translation hook with full features
 * Good for production use
 */
export function createAdvancedTranslationHook(
	fields: string[],
	contentType: "technical" | "general" = "general"
): CollectionBeforeChangeHook {
	return createTranslationHook({
		fields,
		contentType,
		translationService: process.env.NODE_ENV === "development" ? "mock" : "openai",
		triggerCondition: (data, operation) => {
			// More sophisticated trigger logic
			return ["create", "update"].includes(operation) && data.primaryLanguage !== undefined
		},
	})
}
