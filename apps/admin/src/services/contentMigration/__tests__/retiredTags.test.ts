import { describe, expect, it, vi } from "vitest"
import { readRetiredTagSnapshot } from "../retiredTags"

function fixture() {
	const findOne = vi.fn().mockResolvedValue(null)
	const toArray = vi.fn().mockResolvedValue([])
	const limit = vi.fn().mockReturnValue({ toArray })
	const sort = vi.fn().mockReturnValue({ limit })
	const find = vi.fn().mockReturnValue({ sort })
	const countDocuments = vi.fn().mockResolvedValue(0)
	const collection = vi.fn((name: string) =>
		name === "tags" ? { findOne } : { find, countDocuments }
	)
	class ObjectId {
		constructor(public value: string) {}
	}
	const session = { inTransaction: () => true }
	const req = {
		user: { id: "editor" },
		transactionID: undefined as string | undefined,
		payload: {
			config: { collections: [] },
			db: { connection: { base: { Types: { ObjectId } }, collection }, sessions: { tx: session } },
		},
	}
	return { req, collection, findOne, find, sort, limit, countDocuments, session }
}
const id = "6a9a8cb31fd8dde63da92e17"

describe("retired Tag audit reads", () => {
	it("requires authentication before accessing the database", async () => {
		const { req, collection } = fixture()
		await expect(readRetiredTagSnapshot({ ...req, user: null } as never, id)).rejects.toThrow(
			"Authentication"
		)
		expect(collection).not.toHaveBeenCalled()
	})
	it.each(["", "not-an-object-id", "$where", "../tags"])("rejects invalid ID %s", async (value) => {
		const { req, collection } = fixture()
		await expect(readRetiredTagSnapshot(req as never, value)).rejects.toThrow("Invalid")
		expect(collection).not.toHaveBeenCalled()
	})
	it("reads only the exact record and its latest version within the supplied transaction", async () => {
		const { req, collection, findOne, find, sort, limit, countDocuments, session } = fixture()
		req.transactionID = "tx"
		await expect(readRetiredTagSnapshot(req as never, id)).resolves.toEqual({
			record: null,
			latest: null,
			total: 0,
		})
		expect(collection.mock.calls).toEqual([["tags"], ["_tags_versions"]])
		expect(findOne).toHaveBeenCalledWith({ _id: { value: id } }, { session })
		expect(find).toHaveBeenCalledWith({ parent: { value: id } }, { session })
		expect(countDocuments).toHaveBeenCalledWith({ parent: { value: id } }, { session })
		expect(sort).toHaveBeenCalledWith({ updatedAt: -1 })
		expect(limit).toHaveBeenCalledWith(1)
		expect(req.payload.config.collections).toEqual([])
	})
	it("does not silently fall back outside an unavailable transaction", async () => {
		const { req, collection } = fixture()
		req.transactionID = "missing"
		await expect(readRetiredTagSnapshot(req as never, id)).rejects.toThrow("transaction")
		expect(collection).not.toHaveBeenCalled()
	})
})
