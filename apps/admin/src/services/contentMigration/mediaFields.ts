import type { FieldHook } from "payload"

// Run after upload/storage hooks so a publication-only migration keeps raw metadata intact.
export const preserveMigrationMediaField: FieldHook = ({
	collection,
	context,
	field,
	operation,
	req,
	siblingData,
	siblingDocWithLocales,
	value,
}) => {
	if (
		operation !== "update" ||
		collection?.slug !== "media" ||
		!req.user ||
		!req.transactionID ||
		context.contentMigrationJournal !== true ||
		!("name" in field) ||
		typeof field.name !== "string" ||
		!["url", "thumbnailURL", "captureWaitForMs"].includes(field.name)
	)
		return value

	if (!siblingDocWithLocales) throw new Error("A stored Media snapshot is required for migration.")
	if (Object.hasOwn(siblingDocWithLocales, field.name)) return siblingDocWithLocales[field.name]
	delete siblingData[field.name]
	return undefined
}
