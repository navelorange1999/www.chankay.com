import {describe, it, expect} from "vitest";
import {
	LOCALE_CONFIG,
	SUPPORTED_LOCALES,
	getLocaleConfig,
	getLocaleOptions,
} from "../locales";

describe("Locale Configuration", () => {
	describe("LOCALE_CONFIG", () => {
		it("should contain expected locales", () => {
			expect(LOCALE_CONFIG.locales).toHaveLength(2);
			expect(LOCALE_CONFIG.locales[0].code).toBe("en");
			expect(LOCALE_CONFIG.locales[1].code).toBe("zh-CN");
		});

		it("should have proper structure for each locale", () => {
			LOCALE_CONFIG.locales.forEach((locale) => {
				expect(locale).toHaveProperty("code");
				expect(locale).toHaveProperty("name");
				expect(locale).toHaveProperty("flag");
				expect(locale).toHaveProperty("rtl");
				expect(typeof locale.code).toBe("string");
				expect(typeof locale.name).toBe("string");
				expect(typeof locale.flag).toBe("string");
				expect(typeof locale.rtl).toBe("boolean");
			});
		});

		it("should have correct CMS configuration", () => {
			expect(LOCALE_CONFIG.cms).toEqual({
				fallback: true,
			});
		});

		it("should have correct WWW configuration", () => {
			expect(LOCALE_CONFIG.www).toEqual({
				defaultLocale: "en",
				fallbackLocale: "en",
			});
		});
	});

	describe("SUPPORTED_LOCALES", () => {
		it("should contain all locale codes", () => {
			expect(SUPPORTED_LOCALES).toEqual(["en", "zh-CN"]);
		});

		it("should be derived from LOCALE_CONFIG", () => {
			const expectedCodes = LOCALE_CONFIG.locales.map((l) => l.code);
			expect(SUPPORTED_LOCALES).toEqual(expectedCodes);
		});
	});

	describe("getLocaleConfig", () => {
		it("should return correct locale config", () => {
			const enConfig = getLocaleConfig("en");
			expect(enConfig).toEqual({
				code: "en",
				name: "English",
				flag: "🇺🇸",
				rtl: false,
			});

			const zhConfig = getLocaleConfig("zh-CN");
			expect(zhConfig).toEqual({
				code: "zh-CN",
				name: "简体中文",
				flag: "🇨🇳",
				rtl: false,
			});
		});

		it("should return undefined for unknown locale", () => {
			const unknownConfig = getLocaleConfig("unknown" as never);
			expect(unknownConfig).toBeUndefined();
		});
	});

	describe("getLocaleOptions", () => {
		it("should return formatted options for select fields", () => {
			const options = getLocaleOptions();

			expect(options).toHaveLength(2);
			expect(options[0]).toEqual({
				label: "🇺🇸 English",
				value: "en",
			});
			expect(options[1]).toEqual({
				label: "🇨🇳 简体中文",
				value: "zh-CN",
			});
		});

		it("should be suitable for PayloadCMS select field options", () => {
			const options = getLocaleOptions();

			options.forEach((option) => {
				expect(option).toHaveProperty("label");
				expect(option).toHaveProperty("value");
				expect(typeof option.label).toBe("string");
				expect(typeof option.value).toBe("string");
			});
		});
	});
});
