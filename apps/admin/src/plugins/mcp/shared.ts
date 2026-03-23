import configPromise from "@payload-config"
import { getPayload } from "payload"

import { SUPPORTED_LOCALES, type SupportedLocale } from "@/config/locales"

export type McpTextResult = {
	content: Array<{
		text: string
		type: "text"
	}>
}

export const createTextResult = (value: unknown): McpTextResult => {
	return {
		content: [
			{
				text: JSON.stringify(value, null, 2),
				type: "text",
			},
		],
	}
}

export const getPayloadInstance = async () => {
	return getPayload({
		config: configPromise,
	})
}

export const resolveSupportedLocale = (value: unknown): SupportedLocale | undefined => {
	if (typeof value !== "string") {
		return undefined
	}

	return SUPPORTED_LOCALES.includes(value as SupportedLocale)
		? (value as SupportedLocale)
		: undefined
}

export const resolveGlobalLocale = (value: unknown): SupportedLocale | "all" | undefined => {
	if (value === "all") {
		return "all"
	}

	return resolveSupportedLocale(value)
}

export const requireStringArg = (value: unknown, fieldName: string) => {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} must be a non-empty string.`)
	}

	return value
}
