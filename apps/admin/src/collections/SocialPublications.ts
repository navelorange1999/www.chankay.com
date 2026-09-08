import type { CollectionConfig } from "payload"
import { getLocaleOptions } from "@repo/i18n"
import { serviceWriteAccess, socialReadAccess } from "../services/socialPublishing/access"
import { publicationStatuses } from "../services/socialPublishing/state"
import { socialPublicationEndpoints } from "../services/socialPublishing/endpoints"

export const SocialPublications: CollectionConfig = {
	slug: "social-publications",
	endpoints: socialPublicationEndpoints,
	admin: {
		useAsTitle: "snapshotHash",
		defaultColumns: ["sourcePost", "sourceLocale", "status", "updatedAt"],
		group: "Social publishing",
	},
	access: {
		read: socialReadAccess,
		create: serviceWriteAccess,
		update: () => false,
		delete: () => false,
	},
	fields: [
		{
			name: "publicationActions",
			type: "ui",
			admin: {
				components: {
					Field: "/components/socialPublishing/SocialPublicationActions#SocialPublicationActions",
				},
			},
		},
		{ name: "sourcePost", type: "relationship", relationTo: "posts", required: true, index: true },
		{ name: "sourceLocale", type: "select", options: getLocaleOptions(), required: true },
		{ name: "sourceUpdatedAt", type: "date", required: true },
		{ name: "sourceHash", type: "text", required: true },
		{
			name: "account",
			type: "relationship",
			relationTo: "social-accounts",
			required: true,
			index: true,
		},
		{ name: "platform", type: "select", options: ["wechat-official-account"], required: true },
		{ name: "providerAccountId", type: "text", required: true },
		{ name: "idempotencyKey", type: "text", unique: true, index: true, required: true },
		{
			name: "status",
			type: "select",
			options: [...publicationStatuses],
			required: true,
			index: true,
		},
		{ name: "snapshot", type: "json", required: true },
		{ name: "preparedPayload", type: "json", required: true },
		{ name: "snapshotHash", type: "text", required: true },
		{ name: "approval", type: "json" },
		{ name: "remote", type: "json" },
		{ name: "attempts", type: "json" },
		{ name: "lastError", type: "json" },
		{ name: "statusChecks", type: "number", defaultValue: 0 },
		{ name: "nextCheckAt", type: "date" },
		{ name: "claimExpiresAt", type: "date" },
		{ name: "publishedAt", type: "date" },
	],
}
