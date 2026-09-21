import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fixture from "@chankay/handwriting/fixtures/hello-world.json"

const blob = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
const generator = vi.hoisted(() => ({
	loadModel: vi.fn(),
	parseModel: vi.fn(),
	generateHandwriting: vi.fn(),
}))
vi.mock("@vercel/blob", () => blob)
vi.mock("@chankay/handwriting/generator", () => generator)

const modelBytes = new Uint8Array(32).fill(1)
function storedModel() {
	return {
		statusCode: 200,
		blob: { size: modelBytes.length },
		stream: new Response(modelBytes).body,
	}
}

beforeEach(() => {
	vi.resetModules()
	vi.resetAllMocks()
	vi.stubEnv("HANDWRITING_BLOB_READ_WRITE_TOKEN", "test-only-placeholder")
	vi.stubEnv("HANDWRITING_MODEL_URL", "https://model.example/model.bin")
	generator.loadModel.mockRejectedValue(new Error("Upstream unavailable"))
	generator.parseModel.mockResolvedValue({})
	generator.generateHandwriting.mockResolvedValue(fixture)
	vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Upstream unavailable")))
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe("private model persistence", () => {
	it("generates a new artifact from the stored model without contacting upstream", async () => {
		blob.get.mockResolvedValueOnce(null).mockResolvedValueOnce(storedModel())
		blob.put.mockResolvedValue({})
		const { ensureHandwriting } = await import("../service")
		expect(await ensureHandwriting({ text: "Hello world" })).toEqual(fixture)
		expect(generator.parseModel).toHaveBeenCalled()
		expect(generator.loadModel).not.toHaveBeenCalled()
		expect(fetch).not.toHaveBeenCalled()
	})
})

describe("model import", () => {
	it("reads private responses whose SDK size is zero when Content-Length is absent", async () => {
		blob.get.mockResolvedValue({ ...storedModel(), blob: { size: 0 } })
		const { loadPrivateModel } = await import("../model")
		await expect(loadPrivateModel()).resolves.toBeDefined()
		expect(generator.parseModel).toHaveBeenCalled()
		expect(fetch).not.toHaveBeenCalled()
	})
	it("validates bytes before creating one immutable private copy", async () => {
		blob.get.mockResolvedValue(null)
		vi.mocked(fetch).mockResolvedValue(new Response(modelBytes))
		blob.put.mockImplementation(async () => {
			expect(generator.parseModel).toHaveBeenCalled()
			return {}
		})
		const { loadPrivateModel, MODEL_PATH } = await import("../model")
		await loadPrivateModel()
		expect(blob.put).toHaveBeenCalledWith(
			MODEL_PATH,
			expect.any(Uint8Array),
			expect.objectContaining({
				access: "private",
				allowOverwrite: false,
				addRandomSuffix: false,
				contentType: "application/octet-stream",
			})
		)
	})
	it("uses Blob even when the import URL is no longer configured", async () => {
		vi.stubEnv("HANDWRITING_MODEL_URL", "")
		blob.get.mockResolvedValue(storedModel())
		const { loadPrivateModel } = await import("../model")
		await expect(loadPrivateModel()).resolves.toBeDefined()
		expect(fetch).not.toHaveBeenCalled()
	})
	it("does not persist an unverified download", async () => {
		blob.get.mockResolvedValue(null)
		vi.mocked(fetch).mockResolvedValue(new Response(modelBytes))
		generator.parseModel.mockRejectedValue(new Error("Digest mismatch"))
		const { loadPrivateModel } = await import("../model")
		await expect(loadPrivateModel()).rejects.toThrow("Digest mismatch")
		expect(blob.put).not.toHaveBeenCalled()
	})
	it("does not fall back upstream after a storage failure or corrupt stored model", async () => {
		const { loadPrivateModel } = await import("../model")
		blob.get.mockRejectedValueOnce(new Error("Storage unavailable"))
		await expect(loadPrivateModel()).rejects.toThrow("Storage unavailable")
		blob.get.mockResolvedValueOnce(storedModel())
		generator.parseModel.mockRejectedValueOnce(new Error("Digest mismatch"))
		await expect(loadPrivateModel()).rejects.toThrow("Digest mismatch")
		expect(fetch).not.toHaveBeenCalled()
		expect(blob.put).not.toHaveBeenCalled()
	})
	it("reuses the verified winning file when imports race", async () => {
		blob.get.mockResolvedValueOnce(null).mockResolvedValueOnce(storedModel())
		vi.mocked(fetch).mockResolvedValue(new Response(modelBytes))
		blob.put.mockRejectedValueOnce(new Error("Already exists"))
		const { loadPrivateModel } = await import("../model")
		await expect(loadPrivateModel()).resolves.toBeDefined()
		expect(generator.parseModel).toHaveBeenCalledTimes(2)
	})
	it("rejects a stream exceeding the size limit even without a size header", async () => {
		blob.get.mockResolvedValue(null)
		vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array(8_000_001)))
		const { loadPrivateModel } = await import("../model")
		await expect(loadPrivateModel()).rejects.toThrow("Invalid model size")
		expect(generator.parseModel).not.toHaveBeenCalled()
		expect(blob.put).not.toHaveBeenCalled()
	})
	it("rejects embedded credentials and non-HTTP import URLs before fetching", async () => {
		blob.get.mockResolvedValue(null)
		const { loadPrivateModel } = await import("../model")
		for (const url of ["file:///tmp/model.bin", "https://user:example@model.example/model.bin"]) {
			vi.stubEnv("HANDWRITING_MODEL_URL", url)
			await expect(loadPrivateModel()).rejects.toThrow("Invalid model import URL")
		}
		expect(fetch).not.toHaveBeenCalled()
	})
})
