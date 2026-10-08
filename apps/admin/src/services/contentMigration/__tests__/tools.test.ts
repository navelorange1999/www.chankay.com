import { describe, expect, it } from "vitest"
import type { PayloadRequest } from "payload"
import { migrationTools } from "../../../plugins/mcp/migration"

describe("migration MCP authorization and validation", () => {
	it("registers bounded read-only migration operations", () => {
		expect(migrationTools.map((tool) => tool.name)).toEqual([
			"content_migration_inventory",
			"content_migration_review",
			"content_migration_verify",
		])
	})
	it.each(["content_migration_inventory", "content_migration_review", "content_migration_verify"])(
		"rejects unauthenticated %s",
		async (name) => {
			const tool = migrationTools.find((entry) => entry.name === name)!
			await expect(tool.handler({}, {} as PayloadRequest)).rejects.toThrow("Authentication")
		}
	)
	it("rejects forged collections and unbounded inventory requests", async () => {
		const req = { user: { id: "operator" } } as PayloadRequest
		const inventory = migrationTools.find((tool) => tool.name === "content_migration_inventory")!
		await expect(inventory.handler({ collection: "users" }, req)).rejects.toThrow()
		await expect(inventory.handler({ collection: "posts", limit: 10000 }, req)).rejects.toThrow()
	})
})
