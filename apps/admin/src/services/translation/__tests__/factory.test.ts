import { describe, it, expect, vi } from "vitest"
import {
	createTranslationService,
	getOptimalTranslationService,
	createTranslationAdapter,
} from "../factory"
import { UniversalTranslator } from "../universal"
import { MockTranslationAdapter } from "../adapters"

describe("Translation Factory", () => {
	describe("createTranslationService", () => {
		it("should create UniversalTranslator for any provider", () => {
			const service = createTranslationService("mock")
			expect(service).toBeInstanceOf(UniversalTranslator)
		})

		it("should create service with fallback adapter", () => {
			const service = createTranslationService("mock", {
				provider: "mock",
				fallbackProvider: "mock",
			})
			expect(service).toBeInstanceOf(UniversalTranslator)
		})

		it("should handle unknown provider gracefully", () => {
			const service = createTranslationService("unknown" as never)
			expect(service).toBeInstanceOf(UniversalTranslator)
		})
	})

	describe("createTranslationAdapter", () => {
		it("should create MockTranslationAdapter for mock provider", () => {
			const adapter = createTranslationAdapter("mock")
			expect(adapter).toBeInstanceOf(MockTranslationAdapter)
		})

		it("should throw for custom provider without config", () => {
			expect(() => createTranslationAdapter("custom")).toThrow(
				"Custom adapter not provided in config"
			)
		})

		it("should warn and fallback for unknown provider", () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
			const adapter = createTranslationAdapter("unknown" as never)

			expect(consoleSpy).toHaveBeenCalledWith(
				"Unknown translation provider: unknown, falling back to mock"
			)
			expect(adapter).toBeInstanceOf(MockTranslationAdapter)

			consoleSpy.mockRestore()
		})
	})

	describe("getOptimalTranslationService", () => {
		it("should return optimal service for language pairs", () => {
			expect(getOptimalTranslationService("en", "zh-CN")).toBe("baidu")
			expect(getOptimalTranslationService("zh-CN", "en")).toBe("deepl")
		})

		it("should return optimal service for content types", () => {
			expect(getOptimalTranslationService("en", "fr", "technical")).toBe("openai")
			expect(getOptimalTranslationService("en", "fr", "general")).toBe("mock")
		})

		it("should return mock for unknown language pairs", () => {
			expect(getOptimalTranslationService("fr", "de")).toBe("mock")
		})
	})
})
