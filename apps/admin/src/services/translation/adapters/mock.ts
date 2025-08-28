import type { TranslationAdapter } from "../types"

/**
 * Mock translation adapter for development and testing
 * Always available and provides predictable translations
 */
export class MockTranslationAdapter implements TranslationAdapter {
	name = "mock"

	async translateText(text: string, from: string, to: string): Promise<string> {
		if (!text?.trim()) return text

		// Simple mock: prefix with target language
		return `[${to.toUpperCase()}] ${text}`
	}

	isAvailable(): boolean {
		return true // Always available
	}

	getConfig() {
		return {
			type: "mock",
			description: "Mock adapter for development and testing",
		}
	}
}
