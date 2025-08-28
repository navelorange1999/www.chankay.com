import type { TranslationAdapter } from "../types"

/**
 * Custom translation adapter template
 * Extend this class to implement your own translation logic
 */
export abstract class CustomTranslationAdapter implements TranslationAdapter {
	abstract name: string

	/**
	 * Implement your translation logic here
	 * This could be a call to any API, local service, or custom algorithm
	 */
	abstract translateText(text: string, from: string, to: string): Promise<string>

	/**
	 * Check if your translation service is available
	 * e.g., check API keys, network connectivity, service health, etc.
	 */
	abstract isAvailable(): boolean

	/**
	 * Optional: return configuration information
	 */
	getConfig?(): Record<string, unknown>
}

/**
 * Example implementation of a custom adapter
 * You can use this as a starting point
 */
export class ExampleCustomAdapter extends CustomTranslationAdapter {
	name = "example-custom"

	constructor(private config: { endpoint?: string; apiKey?: string } = {}) {
		super()
	}

	async translateText(text: string, from: string, to: string): Promise<string> {
		// Example: Call your own translation API
		/*
    const response = await fetch(`${this.config.endpoint}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: from,
        target_language: to,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translated_text || text;
    */

		// Placeholder implementation
		console.log(`[Custom Adapter] Would translate "${text}" from ${from} to ${to}`)
		return `[CUSTOM-${to.toUpperCase()}] ${text}`
	}

	isAvailable(): boolean {
		// Check if your service is available
		return !!(this.config.endpoint && this.config.apiKey)
	}

	getConfig() {
		return {
			type: "custom",
			endpoint: this.config.endpoint,
			hasApiKey: !!this.config.apiKey,
			description: "Custom translation adapter example",
		}
	}
}

/**
 * Function-based adapter for simple custom implementations
 */
export function createFunctionAdapter(
	name: string,
	translateFn: (text: string, from: string, to: string) => Promise<string>,
	isAvailableFn: () => boolean = () => true,
	config?: Record<string, unknown>
): TranslationAdapter {
	return {
		name,
		translateText: translateFn,
		isAvailable: isAvailableFn,
		getConfig: () => ({ type: "function", ...config }),
	}
}
