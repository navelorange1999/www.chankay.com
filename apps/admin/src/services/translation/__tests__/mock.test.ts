import {describe, it, expect} from "vitest";
import {MockTranslationAdapter} from "../adapters";
import {UniversalTranslator} from "../universal";

describe("MockTranslationAdapter", () => {
	const adapter = new MockTranslationAdapter();
	const translator = new UniversalTranslator(adapter);

	describe("translateText", () => {
		it("should translate text with language prefix", async () => {
			const result = await translator.translateText(
				"Hello world",
				"en",
				"zh-CN"
			);
			expect(result).toBe("[ZH-CN] Hello world");
		});

		it("should handle empty text", async () => {
			const result = await translator.translateText("", "en", "zh-CN");
			expect(result).toBe("");
		});

		it("should handle whitespace-only text", async () => {
			const result = await translator.translateText("   ", "en", "zh-CN");
			expect(result).toBe("   ");
		});
	});

	describe("translateRichText", () => {
		it("should translate string content", async () => {
			const result = await translator.translateRichText(
				"Hello",
				"en",
				"zh-CN"
			);
			expect(result).toBe("[ZH-CN] Hello");
		});

		it("should translate array content", async () => {
			const content = ["Hello", "World"];
			const result = await translator.translateRichText(
				content,
				"en",
				"zh-CN"
			);
			expect(result).toEqual(["[ZH-CN] Hello", "[ZH-CN] World"]);
		});

		it("should translate object with text nodes", async () => {
			const content = {
				type: "paragraph",
				text: "Hello world",
				children: [{type: "text", text: "Nested text"}],
			};

			const result = await translator.translateRichText(
				content,
				"en",
				"zh-CN"
			);

			expect(result.text).toBe("[ZH-CN] Hello world");
			expect(result.children[0]?.text).toBe("[ZH-CN] Nested text");
			expect(result.type).toBe("paragraph"); // Non-text fields preserved
		});

		it("should handle complex nested structures", async () => {
			const content = {
				type: "root",
				children: [
					{
						type: "paragraph",
						text: "First paragraph",
					},
					{
						type: "list",
						children: [
							{type: "listItem", text: "Item 1"},
							{type: "listItem", text: "Item 2"},
						],
					},
				],
			};

			const result = await translator.translateRichText(
				content,
				"en",
				"zh-CN"
			);

			expect((result as any).children[0]?.text).toBe(
				"[ZH-CN] First paragraph"
			);
			expect((result as any).children[1]?.children[0]?.text).toBe(
				"[ZH-CN] Item 1"
			);
			expect((result as any).children[1]?.children[1]?.text).toBe(
				"[ZH-CN] Item 2"
			);
		});

		it("should handle null and undefined content", async () => {
			expect(
				await translator.translateRichText(null, "en", "zh-CN")
			).toBeNull();
			expect(
				await translator.translateRichText(undefined, "en", "zh-CN")
			).toBeUndefined();
		});

		it("should preserve non-object/array content", async () => {
			expect(await translator.translateRichText(123, "en", "zh-CN")).toBe(
				123
			);
			expect(
				await translator.translateRichText(true, "en", "zh-CN")
			).toBe(true);
		});
	});
});
