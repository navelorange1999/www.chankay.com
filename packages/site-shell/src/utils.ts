import type { SiteShellAttributes, SiteShellPosition } from "./types.js"

const VALID_POSITIONS = new Set<SiteShellPosition>(["both", "header", "footer"])

export function asOptionalText(value: string | null | undefined): string | null {
	if (typeof value !== "string") {
		return null
	}

	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

export function asOptionalHttpUrl(value: string | null | undefined): string | null {
	const normalized = asOptionalText(value)
	if (!normalized) {
		return null
	}

	try {
		const url = new URL(normalized)
		return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
	} catch {
		return null
	}
}

export function normalizeSiteShellPosition(value: string | null | undefined): SiteShellPosition {
	if (typeof value !== "string") {
		return "both"
	}

	const normalized = value.trim().toLowerCase()
	return VALID_POSITIONS.has(normalized as SiteShellPosition)
		? (normalized as SiteShellPosition)
		: "both"
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
}

export function readSiteShellAttributes(
	element: Pick<Element, "getAttribute">
): SiteShellAttributes {
	return {
		position: normalizeSiteShellPosition(element.getAttribute("position")),
		repoUrl: asOptionalHttpUrl(element.getAttribute("repo-url")),
		siteName: asOptionalText(element.getAttribute("site-name")),
	}
}

export function resolveMountTarget(target: Element | string): Element {
	if (typeof target !== "string") {
		return target
	}

	const element = document.querySelector(target)
	if (!element) {
		throw new Error(`Could not find a mount target for selector: ${target}`)
	}

	return element
}
