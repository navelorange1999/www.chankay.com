import path from "path"

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function normalizePrefix(prefix: unknown): string | undefined {
	const value = asOptionalString(prefix)
	return value ? value.replace(/^\/+|\/+$/g, "") : undefined
}

export function normalizeStoredFilename(filename: unknown, prefix?: unknown): string | undefined {
	const value = asOptionalString(filename)
	if (!value) {
		return undefined
	}

	const normalizedPrefix = normalizePrefix(prefix)
	const normalizedFilename = value.replace(/^\/+/, "")

	if (normalizedPrefix && normalizedFilename.startsWith(`${normalizedPrefix}/`)) {
		return normalizedFilename.slice(normalizedPrefix.length + 1)
	}

	return path.posix.basename(normalizedFilename)
}

export function buildBlobFileUrl(args: {
	baseUrl?: unknown
	filename?: unknown
	prefix?: unknown
}): string | undefined {
	const baseUrl = asOptionalString(args.baseUrl)?.replace(/\/+$/g, "")
	const filename = normalizeStoredFilename(args.filename, args.prefix)
	const prefix = normalizePrefix(args.prefix)

	if (!baseUrl || !filename) {
		return undefined
	}

	const fileKey = prefix
		? path.posix.join(prefix, encodeURIComponent(filename))
		: encodeURIComponent(filename)
	return `${baseUrl}/${fileKey}`
}

export function buildPayloadMediaFileUrl(args: {
	apiBaseUrl?: unknown
	collectionSlug: string
	filename?: unknown
	prefix?: unknown
}): string | undefined {
	const apiBaseUrl = asOptionalString(args.apiBaseUrl)?.replace(/\/+$/g, "")
	const filename = normalizeStoredFilename(args.filename, args.prefix)

	if (!apiBaseUrl || !filename) {
		return undefined
	}

	return `${apiBaseUrl}/api/${args.collectionSlug}/file/${encodeURIComponent(filename)}`
}
