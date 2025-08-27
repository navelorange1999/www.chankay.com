import {SUPPORTED_LOCALES} from "../../config/locales";

export interface LocalizedField {
	path: string; // Field path: 'title', 'seo.description'
	type: "text" | "richText" | "textarea";
	isRequired?: boolean;
}

/**
 * Detects localized fields in data structure
 * Automatically discovers fields with language-specific content
 */
export function detectLocalizedFields(
	data: Record<string, unknown>,
	path: string = ""
): LocalizedField[] {
	const localizedFields: LocalizedField[] = [];

	if (!data || typeof data !== "object") return localizedFields;

	// Check if current object is a localized field value
	if (isLocalizedFieldValue(data)) {
		const type = inferFieldType(data);
		localizedFields.push({
			path: path,
			type,
		});
		return localizedFields;
	}

	// Recursively detect nested objects
	for (const [key, value] of Object.entries(data)) {
		if (value && typeof value === "object") {
			const nestedPath = path ? `${path}.${key}` : key;
			localizedFields.push(
				...detectLocalizedFields(
					value as Record<string, unknown>,
					nestedPath
				)
			);
		}
	}

	return localizedFields;
}

/**
 * Checks if a value is a localized field (contains language codes as keys)
 */
export function isLocalizedFieldValue(value: Record<string, unknown>): boolean {
	if (!value || typeof value !== "object") return false;

	const keys = Object.keys(value);
	return keys.some((key) => SUPPORTED_LOCALES.includes(key as never));
}

/**
 * Infers field type based on content structure
 */
export function inferFieldType(
	localizedValue: Record<string, unknown>
): "text" | "richText" | "textarea" {
	// Get a sample value to analyze
	const sampleValue = Object.values(localizedValue)[0];

	if (typeof sampleValue === "string") {
		return sampleValue.length > 200 ? "textarea" : "text";
	}

	if (sampleValue && typeof sampleValue === "object") {
		return "richText";
	}

	return "text";
}

/**
 * Utility functions for nested object path operations
 */
export const pathUtils = {
	/**
	 * Get nested value by path: 'title.en' or 'seo.description.zh-CN'
	 */
	getValue<T = unknown>(
		obj: Record<string, unknown>,
		path: string
	): T | undefined {
		return path.split(".").reduce<unknown>((current, key) => {
			return current && typeof current === "object"
				? (current as Record<string, unknown>)[key]
				: undefined;
		}, obj) as T | undefined;
	},

	/**
	 * Set nested value by path
	 */
	setValue(obj: Record<string, unknown>, path: string, value: unknown): void {
		const keys = path.split(".");
		const lastKey = keys.pop()!;

		const target = keys.reduce((current, key) => {
			if (!current[key] || typeof current[key] !== "object") {
				current[key] = {};
			}
			return current[key] as Record<string, unknown>;
		}, obj);

		target[lastKey] = value;
	},

	/**
	 * Check if nested path exists
	 */
	hasPath(obj: Record<string, unknown>, path: string): boolean {
		return this.getValue(obj, path) !== undefined;
	},
};

/**
 * Gets translation status for a field across all supported languages
 */
export function getTranslationStatus(
	data: Record<string, unknown>,
	fieldPath: string,
	primaryLanguage: string
): Record<string, "missing" | "present"> {
	const status: Record<string, "missing" | "present"> = {};

	for (const locale of SUPPORTED_LOCALES) {
		if (locale === primaryLanguage) {
			status[locale] = "present"; // Primary language is always present
		} else {
			const value = pathUtils.getValue(data, `${fieldPath}.${locale}`);
			status[locale] = value ? "present" : "missing";
		}
	}

	return status;
}

/**
 * Checks if any translations are missing for given fields
 */
export function hasMissingTranslations(
	data: Record<string, unknown>,
	fieldPaths: string[],
	primaryLanguage: string
): boolean {
	return fieldPaths.some((fieldPath) => {
		const status = getTranslationStatus(data, fieldPath, primaryLanguage);
		return Object.entries(status).some(
			([locale, s]) => locale !== primaryLanguage && s === "missing"
		);
	});
}
