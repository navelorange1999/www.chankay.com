import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import type { NumberField, PayloadRequest } from "payload"
import { Media } from "@/collections/Media"

const captureWaitField = Media.fields.find(
	(field) => "name" in field && field.name === "captureWaitForMs"
) as NumberField

const require = createRequire(import.meta.url)
const adapterEntry = require.resolve("@payloadcms/db-mongodb")
const adapterRequire = createRequire(adapterEntry)

// Model construction applies the same schema defaults as MongoDB createVersion's Model.create.
// An unopened connection keeps this regression independent of database access.
describe("Media version defaults", () => {
	it("keeps a missing capture delay absent when constructing a published version", async () => {
		const { buildSchema } = await import(
			pathToFileURL(path.join(path.dirname(adapterEntry), "models/buildSchema.js")).href
		)
		const mongoose = adapterRequire("mongoose")
		const connection = mongoose.createConnection()
		try {
			const schema = buildSchema({
				buildSchemaOptions: {
					disableUnique: true,
					draftsEnabled: true,
					options: { minimize: false, timestamps: false },
				},
				configFields: [
					{
						name: "version",
						type: "group",
						fields: [captureWaitField, { name: "_status", type: "text" }],
					},
				],
				payload: { config: {} },
			})
			const Model = connection.model("MediaMigrationVersionDefaults", schema)
			const document = new Model({ version: { _status: "published" } }).toObject()
			expect(document.version).toEqual({ _status: "published" })
			expect(Object.hasOwn(document.version, "captureWaitForMs")).toBe(false)
		} finally {
			await connection.close()
		}
	})

	it("retains the normal Payload capture delay default", async () => {
		const defaultValue = captureWaitField.defaultValue
		const value =
			typeof defaultValue === "function"
				? await defaultValue({ req: {} as PayloadRequest, user: null })
				: defaultValue
		expect(value).toBe(1500)
	})
})
