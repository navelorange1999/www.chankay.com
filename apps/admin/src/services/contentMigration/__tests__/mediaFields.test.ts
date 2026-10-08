import { describe, expect, it } from "vitest"
import type { FieldHook, TextField, NumberField } from "payload"
import { Media } from "@/collections/Media"

const fields = ["url", "thumbnailURL", "captureWaitForMs"] as const

async function transform(name: string, stored: Record<string, unknown>, migration = true) {
	const field = Media.fields.find((item) => "name" in item && item.name === name) as
		| TextField
		| NumberField
		| undefined

	const data: Record<string, unknown> = {
		[name]: name === "captureWaitForMs" ? 1500 : "https://new.example/image.png",
	}
	for (const hook of field?.hooks?.beforeChange ?? []) {
		const value = await hook({
			field,
			value: data[name],
			siblingData: data,
			siblingDocWithLocales: stored,
			operation: "update",
			collection: { slug: "media" },
			req: { user: { id: "operator" }, transactionID: migration ? "transaction" : undefined },
			context: { contentMigrationJournal: migration },
		} as unknown as Parameters<FieldHook>[0])
		if (value !== undefined) data[name] = value
	}
	return data
}

describe("publication-only Media migration", () => {
	it.each(fields)("preserves missing %s instead of persisting generated values", async (name) => {
		expect(await transform(name, {})).toEqual({})
	})
	it.each(fields)("preserves the stored %s value", async (name) => {
		const stored = { [name]: name === "captureWaitForMs" ? 700 : "https://old.example/image.png" }
		expect(await transform(name, stored)).toEqual(stored)
	})
	it("leaves ordinary media edits unchanged", async () => {
		expect(await transform("url", { url: "https://old.example/image.png" }, false)).toEqual({
			url: "https://new.example/image.png",
		})
	})
})
