const UNSAFE_PATH_SEGMENT = /[\\/?#%]/
const WHITESPACE = /\s/u

export const POST_SLUG_MAX_LENGTH = 200

function hasControlCharacter(value: string): boolean {
	return [...value].some((character) => {
		const codePoint = character.codePointAt(0)!
		return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)
	})
}

export function isSafePostSlug(value: unknown): value is string {
	if (
		typeof value !== "string" ||
		value.trim().length === 0 ||
		value.length > POST_SLUG_MAX_LENGTH
	) {
		return false
	}

	return (
		value !== "." &&
		value !== ".." &&
		!WHITESPACE.test(value) &&
		!UNSAFE_PATH_SEGMENT.test(value) &&
		!hasControlCharacter(value)
	)
}

export function validatePostSlug(value: unknown): true | string {
	return isSafePostSlug(value) || "Slug must be a safe URL path segment."
}
