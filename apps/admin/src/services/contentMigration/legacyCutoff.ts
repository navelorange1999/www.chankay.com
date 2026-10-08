/** Historical migration configuration; never used by live content access. */
export function publicationCompatibilityCutoff(): string | null {
	if (process.env.CONTENT_PUBLICATION_MODE !== "compatibility") return null
	const value = process.env.CONTENT_PUBLICATION_LEGACY_BEFORE
	if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null
	const timestamp = Date.parse(value)
	return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? value : null
}
