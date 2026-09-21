import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fixture from "@chankay/handwriting/fixtures/hello-world.json"
import { validateArtifact } from "@chankay/handwriting/schema"
import { readArtifact, writeArtifact } from "../blob"
const blob = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock("@vercel/blob", () => blob)
const artifact = validateArtifact(fixture)
const found = (value: unknown = artifact) => ({
	statusCode: 200,
	stream: new Response(JSON.stringify(value)).body,
	blob: { size: 1000 },
})
beforeEach(() => {
	vi.stubEnv("HANDWRITING_BLOB_READ_WRITE_TOKEN", "test-only-placeholder")
	blob.get.mockReset()
	blob.put.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe("private handwriting artifact storage", () => {
	it("reads validated artifacts from the private deterministic path", async () => {
		blob.get.mockResolvedValueOnce(found())
		expect(await readArtifact(artifact.fingerprint)).toEqual(artifact)
		expect(blob.get).toHaveBeenCalledWith(
			`handwriting/v1/${artifact.fingerprint}.json`,
			expect.objectContaining({ access: "private", useCache: false })
		)
	})
	it("distinguishes a missing artifact from storage failure", async () => {
		blob.get.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("Unavailable"))
		expect(await readArtifact(artifact.fingerprint)).toBeNull()
		await expect(readArtifact(artifact.fingerprint)).rejects.toThrow("Unavailable")
	})
	it("rejects wrong-key data and invalid paths", async () => {
		blob.get.mockResolvedValueOnce(found({ ...artifact, fingerprint: "b".repeat(64) }))
		await expect(readArtifact(artifact.fingerprint)).rejects.toThrow()
		await expect(readArtifact("../../other")).rejects.toThrow("Invalid handwriting fingerprint")
		expect(blob.get).toHaveBeenCalledTimes(1)
	})
	it("reuses the winner when another instance creates the same immutable file", async () => {
		blob.put.mockRejectedValueOnce(new Error("Already exists"))
		blob.get.mockResolvedValueOnce(found())
		expect(await writeArtifact(artifact.fingerprint, artifact)).toEqual(artifact)
		expect(blob.put).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(String),
			expect.objectContaining({ allowOverwrite: false, addRandomSuffix: false, access: "private" })
		)
	})
})
