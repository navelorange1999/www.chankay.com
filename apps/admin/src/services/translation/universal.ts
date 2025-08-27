import type {TranslationService, TranslationAdapter} from "./types";

/**
 * Universal translation service that can work with any translation adapter
 * Provides consistent interface while allowing flexible backend implementations
 */
export class UniversalTranslator implements TranslationService {
	private adapter: TranslationAdapter;
	private fallbackAdapter?: TranslationAdapter;

	constructor(
		adapter: TranslationAdapter,
		fallbackAdapter?: TranslationAdapter
	) {
		this.adapter = adapter;
		this.fallbackAdapter = fallbackAdapter;
	}

	async translateText(
		text: string,
		from: string,
		to: string
	): Promise<string> {
		if (!text?.trim()) return text;

		try {
			// Try primary adapter
			if (this.adapter.isAvailable()) {
				return await this.adapter.translateText(text, from, to);
			}

			// Fallback to secondary adapter
			if (this.fallbackAdapter?.isAvailable()) {
				console.warn(
					`Primary adapter ${this.adapter.name} unavailable, using fallback ${this.fallbackAdapter.name}`
				);
				return await this.fallbackAdapter.translateText(text, from, to);
			}

			throw new Error("No available translation adapters");
		} catch (error) {
			// Try fallback adapter on error
			if (this.fallbackAdapter?.isAvailable()) {
				console.warn(
					`Translation failed with ${this.adapter.name}, trying fallback:`,
					error
				);
				try {
					return await this.fallbackAdapter.translateText(
						text,
						from,
						to
					);
				} catch (fallbackError) {
					console.error(
						`Fallback translation also failed:`,
						fallbackError
					);
				}
			}

			// Return original text if all fails
			console.error(
				`All translation attempts failed for "${text.substring(0, 50)}...":`,
				error
			);
			return text;
		}
	}

	async translateRichText<T>(
		content: T,
		from: string,
		to: string
	): Promise<T> {
		if (!content) return content;

		// Handle string content
		if (typeof content === "string") {
			return this.translateText(content, from, to) as Promise<T>;
		}

		// Handle array content
		if (Array.isArray(content)) {
			const translatedArray = await Promise.all(
				content.map((item) => this.translateRichText(item, from, to))
			);
			return translatedArray as T;
		}

		// Handle object content
		if (content && typeof content === "object") {
			const translated = {...content} as Record<string, unknown>;

			for (const [key, value] of Object.entries(content)) {
				if (key === "text" && typeof value === "string") {
					translated[key] = await this.translateText(value, from, to);
				} else if (
					value &&
					(typeof value === "object" || Array.isArray(value))
				) {
					translated[key] = await this.translateRichText(
						value,
						from,
						to
					);
				}
			}

			return translated as T;
		}

		return content;
	}

	/**
	 * Get information about current adapters
	 */
	getAdapterInfo() {
		return {
			primary: {
				name: this.adapter.name,
				available: this.adapter.isAvailable(),
				config: this.adapter.getConfig?.(),
			},
			fallback: this.fallbackAdapter
				? {
						name: this.fallbackAdapter.name,
						available: this.fallbackAdapter.isAvailable(),
						config: this.fallbackAdapter.getConfig?.(),
					}
				: null,
		};
	}
}
