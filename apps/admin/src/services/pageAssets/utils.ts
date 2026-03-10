import { createHash } from "crypto"

import { DEFAULT_WAIT_FOR_MS, PREVIEW_ROUTE_PREFIX } from "./constants"
import type { GenericBlock } from "./types"

export function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object") return {}
	return value as Record<string, unknown>
}

export function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

export function asOptionalBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined
}

export function asOptionalNonNegativeNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined
}

export function resolveWaitForMs(value: unknown): number {
	return asOptionalNonNegativeNumber(value) ?? DEFAULT_WAIT_FOR_MS
}

export function asArray(value: unknown): GenericBlock[] {
	if (!Array.isArray(value)) return []
	return value.filter((item) => item && typeof item === "object") as GenericBlock[]
}

export function resolvePagePath(slug?: string | null): string {
	const value = asOptionalString(slug)
	if (!value || value === "/") {
		return "/"
	}

	return `/${value.replace(/^\/+|\/+$/g, "")}`
}

export function resolvePreviewPagePath(slug?: string | null): string {
	const pagePath = resolvePagePath(slug)
	if (pagePath === "/") {
		return PREVIEW_ROUTE_PREFIX
	}

	return `${PREVIEW_ROUTE_PREFIX}${pagePath}`
}

function sanitizeFilenamePart(value: string): string {
	return (
		value
			.toLowerCase()
			.replace(/[^a-z0-9-]+/g, "-")
			.replace(/^-+|-+$/g, "") || "page"
	)
}

function inferFileExtension(contentType: string): string {
	if (contentType.includes("jpeg")) return "jpg"
	if (contentType.includes("webp")) return "webp"
	return "png"
}

export function buildGeneratedFilename(
	prefix: string,
	subject: string,
	contentType: string
): string {
	const safeSubject = sanitizeFilenamePart(subject)
	const suffix = createHash("sha1").update(`${prefix}:${subject}`).digest("hex").slice(0, 8)
	return `${prefix}-${safeSubject}-${suffix}.${inferFileExtension(contentType)}`
}

export function cloneBlocks(value: unknown): GenericBlock[] {
	return asArray(value).map((block) => {
		const next: GenericBlock = { ...block }
		if (Array.isArray(block.children)) {
			next.children = cloneBlocks(block.children)
		}
		return next
	})
}

export function collectBlocksById(value: unknown, map: Map<string, GenericBlock>) {
	for (const block of asArray(value)) {
		const id = asOptionalString(block.id)
		if (id) {
			map.set(id, block)
		}

		if (Array.isArray(block.children)) {
			collectBlocksById(block.children, map)
		}
	}
}

export function resolvePreviewStatus(value: unknown): "idle" | "generating" | "ready" | "failed" {
	return value === "generating" || value === "ready" || value === "failed" ? value : "idle"
}

export function redactUrlToken(url: URL): string {
	const redacted = new URL(url.toString())
	if (redacted.searchParams.has("token")) {
		redacted.searchParams.set("token", "[REDACTED]")
	}
	return redacted.toString()
}

export function redactRequestHeaders(
	headers?: Record<string, string>
): Record<string, string> | undefined {
	if (!headers) {
		return undefined
	}

	return Object.fromEntries(
		Object.entries(headers).map(([key, value]) => {
			const normalizedKey = key.toLowerCase()
			if (
				normalizedKey.includes("secret") ||
				normalizedKey.includes("token") ||
				normalizedKey.includes("authorization")
			) {
				return [key, "[REDACTED]"]
			}

			return [key, value]
		})
	)
}

export function cloneMaybeDoc<T>(value: T): T {
	if (typeof structuredClone === "function") {
		return structuredClone(value)
	}

	return JSON.parse(JSON.stringify(value)) as T
}
