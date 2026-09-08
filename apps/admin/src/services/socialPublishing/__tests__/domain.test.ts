import { describe, expect, it } from "vitest"
import { hashSnapshot, preparationKey } from "../snapshot"
import { canQueue, claimState, recoveryAction } from "../state"
import { requireOperator, serviceWriteAccess } from "../access"

describe("publication safety", () => {
	it("hashes canonical object order while preserving ordered media", () => {
		expect(hashSnapshot({ a: 1, b: 2 })).toBe(hashSnapshot({ b: 2, a: 1 }))
		expect(hashSnapshot({ media: [1, 2] })).not.toBe(hashSnapshot({ media: [2, 1] }))
		expect(preparationKey("a")).not.toBe(preparationKey("b"))
	})
	it("requires admin for publication and a real user for all commands", () => {
		expect(() =>
			requireOperator({ user: { id: "u", role: "editor", collection: "users" } } as never, true)
		).toThrow()
		expect(() => requireOperator({ user: null } as never)).toThrow()
		expect(
			requireOperator({ user: { id: "u", role: "editor", collection: "users" } } as never).id
		).toBe("u")
		expect(
			serviceWriteAccess({
				req: { user: { role: "admin" }, context: { socialPublishing: true } },
			} as never)
		).toBe(false)
	})
	it("allows only matching, unambiguous failures without known remote IDs", () => {
		const record = {
			status: "failed",
			remote: {},
			lastError: { stage: "publish", retryable: true, ambiguous: false },
		}
		expect(canQueue(record, "publish")).toBe(true)
		expect(canQueue(record, "create-draft")).toBe(false)
		expect(canQueue({ ...record, remote: { submissionId: "known" } }, "publish")).toBe(false)
		expect(
			canQueue({ ...record, lastError: { ...record.lastError, ambiguous: true } }, "publish")
		).toBe(false)
		expect(canQueue({ status: "unknown" }, "publish")).toBe(false)
		expect(canQueue({ status: "prepared" }, "publish")).toBe(false)
		expect(canQueue({ status: "prepared" }, "publish", "unsupported")).toBe(true)
		expect(canQueue({ status: "prepared" }, "create-draft", "unsupported")).toBe(false)
		expect(claimState("status-check")).toEqual(["status_check_queued", "status_checking"])
	})
	it("offers safe redispatch from the Admin UI only for queued work or a known submission", () => {
		expect(recoveryAction({ status: "draft_queued" })).toBe("create-draft")
		expect(recoveryAction({ status: "publish_queued" })).toBe("publish")
		expect(recoveryAction({ status: "unknown", remote: { submissionId: "known" } })).toBe("publish")
		expect(recoveryAction({ status: "unknown" })).toBeNull()
		expect(recoveryAction({ status: "publishing" })).toBeNull()
		expect(
			recoveryAction({ status: "unknown", remote: { submissionId: "known" }, statusChecks: 10 })
		).toBeNull()
		expect(recoveryAction({ status: "publishing", claimExpiresAt: "2026-01-01T00:00:00Z" })).toBe(
			"publish"
		)
	})
})
