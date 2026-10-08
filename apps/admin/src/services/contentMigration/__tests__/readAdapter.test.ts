import { describe, expect, it } from "vitest"
import { buildVersionCollectionFields } from "payload"
import { transform } from "@payloadcms/db-mongodb/internal"
import { migrationReadAdapter } from "../readAdapter"

function fixture() {
	const collections = Object.fromEntries(
		["posts", "pages", "series", "tags"].map((slug) => [
			slug,
			{
				config: { slug, fields: [], flattenedFields: [], versions: { drafts: true } },
			},
		])
	)
	const payload = {
		collections,
		config: { collections: Object.values(collections).map(({ config }) => config) },
	}
	const record = {
		id: "record1",
		status: "published",
		primaryTag: "tag1",
		postCount: 3,
		postsen: [],
		postszh: [],
		unknown: "must disappear",
	}
	const db = {
		allowAdditionalKeys: false,
		payload,
		async find(this: { payload: typeof payload }, { collection }: { collection: string }) {
			const data = { ...record }
			transform({
				adapter: this,
				data,
				fields: this.payload.collections[collection]!.config.fields,
				operation: "read",
			} as never)
			return { docs: [data] }
		},
		async findVersions(this: { payload: typeof payload }, { collection }: { collection: string }) {
			const data = { id: "version1", version: { ...record }, unknown: "must disappear" }
			const fields = buildVersionCollectionFields(
				this.payload.config as never,
				this.payload.collections[collection]!.config as never
			)
			transform({ adapter: this, data, fields, operation: "read" } as never)
			return { docs: [data] }
		},
	}
	return db
}

describe("historical migration reads after schema removal", () => {
	it.each([
		["posts", { status: "published", primaryTag: "tag1" }],
		["pages", { status: "published" }],
		["series", { status: "published" }],
		["tags", {}],
	] as const)(
		"restores only retired %s fields in records and versions",
		async (collection, retired) => {
			const db = fixture()
			const audit = migrationReadAdapter({ db } as never)
			expect((await audit.find({ collection })).docs).toEqual([{ id: "record1", ...retired }])
			expect((await audit.findVersions({ collection })).docs).toEqual([
				{ id: "version1", version: { ...retired } },
			])
			expect(db.allowAdditionalKeys).toBe(false)
			expect(db.payload.collections[collection]!.config.fields).toEqual([])
			expect((await db.find({ collection })).docs).toEqual([{ id: "record1" }])
		}
	)
})
