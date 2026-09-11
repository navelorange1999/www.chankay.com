import { z } from "zod"
import { SUPPORTED_LOCALES, type SupportedLocale } from "@repo/i18n"

export const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/)
export const publicationAssetsSchema = z
	.object({
		coverMediaId: identifier.optional(),
		diagramImages: z
			.array(
				z
					.object({
						definition: z.string().min(1).max(10000),
						mediaId: identifier,
					})
					.strict()
			)
			.max(7)
			.optional(),
	})
	.strict()
export const prepareParameters = {
	assets: publicationAssetsSchema.optional(),
	accountId: identifier,
	postId: identifier,
	locale: z.enum(SUPPORTED_LOCALES as [SupportedLocale, ...SupportedLocale[]]),
}
export const commandParameters = {
	publicationId: identifier,
	expectedSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
}
export const prepareSchema = z.object(prepareParameters).strict()
export const commandSchema = z.object(commandParameters).strict()
export const inspectedDraftRetrySchema = z
	.object({
		...commandParameters,
		confirmedNoRemoteDraft: z.literal(true),
	})
	.strict()
export const queueSchema = z
	.object({
		action: z.enum(["create-draft", "publish", "status-check"]),
		publicationId: identifier,
	})
	.strict()
export const settingsSchema = z
	.object({
		author: z.string().max(8).default(""),
		openComments: z.boolean().default(false),
		onlyFansCanComment: z.boolean().default(false),
	})
	.strict()

export function relationshipID(value: unknown): string {
	if (typeof value === "string") return identifier.parse(value)
	if (value && typeof value === "object" && "id" in value) return identifier.parse(value.id)
	throw new Error("A valid document relationship is required.")
}

export function trustedMediaURL(value: string): URL {
	const origins = [process.env.VERCEL_BLOB_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_SERVER_URL]
		.filter(Boolean)
		.map((entry) => new URL(entry!).origin)
	const url = new URL(value, process.env.NEXT_PUBLIC_SERVER_URL || "https://invalid.local")
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		!origins.includes(url.origin)
	) {
		throw new Error("Media must use a configured first-party HTTPS origin.")
	}
	return url
}
