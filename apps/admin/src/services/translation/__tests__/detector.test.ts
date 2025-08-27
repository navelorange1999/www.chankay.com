import {describe, it, expect} from "vitest";
import {
	detectLocalizedFields,
	isLocalizedFieldValue,
	inferFieldType,
	pathUtils,
	getTranslationStatus,
	hasMissingTranslations,
} from "../detector";

describe("Translation Detector", () => {
	describe("isLocalizedFieldValue", () => {
		it("should detect localized field values", () => {
			const localizedValue = {
				en: "Hello",
				"zh-CN": "你好",
			};

			expect(isLocalizedFieldValue(localizedValue)).toBe(true);
		});

		it("should not detect non-localized values", () => {
			const nonLocalizedValue = {
				name: "test",
				description: "test description",
			};

			expect(isLocalizedFieldValue(nonLocalizedValue)).toBe(false);
		});

		it("should handle null and undefined", () => {
			expect(isLocalizedFieldValue({} as Record<string, unknown>)).toBe(
				false
			);
		});
	});

	describe("inferFieldType", () => {
		it("should infer text type for short strings", () => {
			const localizedValue = {
				en: "Short text",
				"zh-CN": "短文本",
			};

			expect(inferFieldType(localizedValue)).toBe("text");
		});

		it("should infer textarea type for long strings", () => {
			const localizedValue = {
				en: "A".repeat(250),
				"zh-CN": "中".repeat(250),
			};

			expect(inferFieldType(localizedValue)).toBe("textarea");
		});

		it("should infer richText type for objects", () => {
			const localizedValue = {
				en: {type: "paragraph", children: [{text: "Hello"}]},
				"zh-CN": {type: "paragraph", children: [{text: "你好"}]},
			};

			expect(inferFieldType(localizedValue)).toBe("richText");
		});
	});

	describe("detectLocalizedFields", () => {
		it("should detect simple localized fields", () => {
			const data = {
				title: {
					en: "Hello",
					"zh-CN": "你好",
				},
				slug: "hello-world", // non-localized
			};

			const fields = detectLocalizedFields(data);

			expect(fields).toHaveLength(1);
			expect(fields[0]?.path).toBe("title");
			expect(fields[0]?.type).toBe("text");
		});

		it("should detect nested localized fields", () => {
			const data = {
				seo: {
					title: {
						en: "SEO Title",
						"zh-CN": "SEO标题",
					},
					description: {
						en: "SEO Description",
						"zh-CN": "SEO描述",
					},
				},
			};

			const fields = detectLocalizedFields(data);

			expect(fields).toHaveLength(2);
			expect(fields.find((f) => f.path === "seo.title")).toBeDefined();
			expect(
				fields.find((f) => f.path === "seo.description")
			).toBeDefined();
		});

		it("should handle empty or invalid data", () => {
			expect(detectLocalizedFields({})).toHaveLength(0);
		});
	});

	describe("pathUtils", () => {
		const testData = {
			title: {
				en: "Hello",
				"zh-CN": "你好",
			},
			seo: {
				title: {
					en: "SEO Title",
					"zh-CN": "SEO标题",
				},
			},
		};

		it("should get nested values correctly", () => {
			expect(pathUtils.getValue(testData, "title.en")).toBe("Hello");
			expect(pathUtils.getValue(testData, "seo.title.zh-CN")).toBe(
				"SEO标题"
			);
			expect(pathUtils.getValue(testData, "nonexistent")).toBeUndefined();
		});

		it("should set nested values correctly", () => {
			const data = {...testData};
			pathUtils.setValue(data, "title.ja", "日本語");

			expect(pathUtils.getValue(data, "title.ja")).toBe("日本語");
		});

		it("should create nested paths when setting", () => {
			const data: Record<string, unknown> = {};
			pathUtils.setValue(data, "deeply.nested.path", "value");

			expect(pathUtils.getValue(data, "deeply.nested.path")).toBe(
				"value"
			);
		});

		it("should check path existence correctly", () => {
			const freshTestData = {
				title: {
					en: "Hello",
					"zh-CN": "你好",
				},
				seo: {
					title: {
						en: "SEO Title",
						"zh-CN": "SEO标题",
					},
				},
			};

			expect(pathUtils.hasPath(freshTestData, "title.en")).toBe(true);
			expect(pathUtils.hasPath(freshTestData, "title.ja")).toBe(false);
		});
	});

	describe("getTranslationStatus", () => {
		it("should return correct translation status", () => {
			const data = {
				title: {
					en: "Hello",
					"zh-CN": "你好",
				},
			};

			const status = getTranslationStatus(data, "title", "en");

			expect(status.en).toBe("present");
			expect(status["zh-CN"]).toBe("present");
		});

		it("should detect missing translations", () => {
			const data = {
				title: {
					en: "Hello",
				},
			};

			const status = getTranslationStatus(data, "title", "en");

			expect(status.en).toBe("present");
			expect(status["zh-CN"]).toBe("missing");
		});
	});

	describe("hasMissingTranslations", () => {
		it("should detect missing translations", () => {
			const data = {
				title: {
					en: "Hello",
					// zh-CN missing
				},
				excerpt: {
					en: "Excerpt",
					"zh-CN": "摘要",
				},
			};

			expect(
				hasMissingTranslations(data, ["title", "excerpt"], "en")
			).toBe(true);
			expect(hasMissingTranslations(data, ["excerpt"], "en")).toBe(false);
		});

		it("should handle non-existent fields", () => {
			const data = {};

			expect(hasMissingTranslations(data, ["nonexistent"], "en")).toBe(
				true
			);
		});
	});
});
