import type { CollectionConfig } from "payload"
import { getLocaleOptions } from "@repo/i18n"
import { accountAdminAccess, socialReadAccess } from "../services/socialPublishing/access"
import { settingsSchema } from "../services/socialPublishing/validation"

export const SocialAccounts: CollectionConfig = {
	slug: "social-accounts",
	admin: {
		useAsTitle: "name",
		defaultColumns: ["name", "platform", "enabled"],
		group: "Social publishing",
	},
	access: {
		read: socialReadAccess,
		create: accountAdminAccess,
		update: accountAdminAccess,
		delete: accountAdminAccess,
	},
	hooks: {
		beforeDelete: [
			async ({ id, req }) => {
				const used = await req.payload.find({
					collection: "social-publications",
					where: { account: { equals: id } },
					limit: 1,
					depth: 0,
					req,
					user: req.user,
					overrideAccess: false,
				})
				if (used.docs.length)
					throw new Error(
						"Accounts with publication history cannot be deleted. Disable the account instead."
					)
			},
		],
		beforeChange: [
			({ data, originalDoc, operation }) => {
				if (
					operation === "update" &&
					((data.platform !== undefined && data.platform !== originalDoc.platform) ||
						(data.providerAccountId !== undefined &&
							data.providerAccountId !== originalDoc.providerAccountId))
				)
					throw new Error("Social account destination identity is immutable.")
				const merged = { ...originalDoc, ...data }
				if (!merged.allowedLocales?.includes(merged.defaultLocale))
					throw new Error("Default locale must be an allowed locale.")
				if (data.platformSettings)
					data.platformSettings = settingsSchema.parse(data.platformSettings)
				return data
			},
		],
	},
	fields: [
		{ name: "name", type: "text", required: true, maxLength: 120 },
		{ name: "platform", type: "select", required: true, options: ["wechat-official-account"] },
		{
			name: "providerAccountId",
			type: "text",
			required: true,
			maxLength: 128,
			admin: {
				description: "Immutable WeChat application ID. Create a new account to change destination.",
			},
			validate: (value: unknown) =>
				(typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value)) ||
				"Invalid provider identity.",
		},
		{ name: "enabled", type: "checkbox", defaultValue: false, required: true },
		{ name: "defaultLocale", type: "select", required: true, options: getLocaleOptions() },
		{
			name: "allowedLocales",
			type: "select",
			hasMany: true,
			required: true,
			options: getLocaleOptions(),
		},
		{ name: "eligiblePrimaryTags", type: "relationship", relationTo: "tags", hasMany: true },
		{
			name: "credentialReference",
			type: "select",
			required: true,
			options: ["wechat-primary"],
			access: { read: ({ req }) => req.payloadAPI !== "MCP" },
		},
		{
			name: "platformSettings",
			type: "group",
			fields: [
				{ name: "author", type: "text", maxLength: 8, defaultValue: "" },
				{ name: "openComments", type: "checkbox", defaultValue: false },
				{ name: "onlyFansCanComment", type: "checkbox", defaultValue: false },
			],
		},
	],
}
