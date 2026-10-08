import { describe, expect, it } from "vitest"
import { transform } from "@payloadcms/db-mongodb/internal"
import { migrationReadAdapter } from "../readAdapter"

describe("historical migration reads after schema removal", () => {
	it("preserves removed fields for audit without relaxing the live adapter", async () => {
		const db = {
			allowAdditionalKeys: false,
			payload: { config: {} },
			async find(this: object) {
				const data = { id: "post1", status: "published", primaryTag: "tag1" }
				transform({ adapter: this, data, fields: [], operation: "read" } as never)
				return { docs: [data] }
			},
		}
		const audit = migrationReadAdapter({ db } as never)
		expect((await audit.find({ collection: "posts" })).docs).toEqual([
			{ id: "post1", status: "published", primaryTag: "tag1" },
		])
		expect(db.allowAdditionalKeys).toBe(false)
		expect((await db.find()).docs).toEqual([{ id: "post1" }])
	})
})
