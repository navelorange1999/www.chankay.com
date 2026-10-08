import type { CollectionConfig } from "payload"
import { authenticated } from "../access/authenticated"

/** Append-only operational metadata; no article bodies or credentials are stored. */
export const ContentMigrationRuns: CollectionConfig = {
	slug: "content-migration-runs",
	admin: { useAsTitle: "recordId", group: "Operations" },
	access: {
		read: authenticated,
		create: ({ req }) => Boolean(req.user && req.context.contentMigrationJournal === true),
		update: () => false,
		delete: () => false,
	},
	fields: [
		{
			name: "operation",
			type: "select",
			options: ["publication", "taxonomy", "create-category"],
			required: true,
		},
		{
			name: "collectionSlug",
			type: "select",
			options: ["posts", "pages", "media", "tags", "series", "categories"],
			required: true,
		},
		{ name: "recordId", type: "text", required: true, index: true },
		{ name: "operatorId", type: "text", required: true },
		{ name: "planHash", type: "text", required: true },
		{ name: "rollbackOf", type: "text", index: true },
		{ name: "before", type: "json", required: true },
		{ name: "after", type: "json", required: true },
		{ name: "beforeSnapshotHash", type: "text" },
		{ name: "afterSnapshotHash", type: "text", required: true },
		{ name: "beforeVersionHash", type: "text" },
		{ name: "afterVersionHash", type: "text", required: true },
		{ name: "beforeVersionId", type: "text" },
		{ name: "afterVersionId", type: "text", required: true },
		{ name: "beforeUpdatedAt", type: "text" },
		{ name: "afterUpdatedAt", type: "text", required: true },
	],
}
