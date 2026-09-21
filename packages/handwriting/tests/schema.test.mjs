import test from "node:test"
import assert from "node:assert/strict"
const api = await import("../dist/schema.js").catch(() => ({}))

test("canonical normalization and fingerprint ignore input property order and explicit defaults", async () => {
	assert.equal(typeof api.normalizeInput, "function")
	assert.deepEqual(api.normalizeInput({ text: "  Hello   world  " }), {
		text: "Hello world",
		style: "rounded",
		seed: 42,
		legibility: 0.85,
	})
	assert.equal(
		await api.fingerprint({ text: "Hello" }),
		await api.fingerprint({ seed: 42, legibility: 0.85, style: "rounded", text: "Hello" })
	)
	assert.notEqual(
		await api.fingerprint({ text: "Hello" }),
		await api.fingerprint({ text: "Hello", seed: 43 })
	)
})
test("rejects unsupported text, newlines, unexpected properties and invalid parameters", () => {
	assert.equal(typeof api.normalizeInput, "function")
	for (const input of [
		{ text: "Hi\nthere" },
		{ text: "Hi\tthere" },
		{ text: "你好" },
		{ text: "hello_" },
		{ text: "" },
		{ text: "x".repeat(51) },
		{ text: "Hi", style: "other" },
		{ text: "Hi", seed: -1 },
		{ text: "Hi", seed: 1.1 },
		{ text: "Hi", legibility: 3 },
		{ text: "Hi", extra: 1 },
	])
		assert.throws(() => api.normalizeInput(input))
})
test("artifact parser accepts only bounded own path syntax and consistent sequential timing", () => {
	assert.equal(typeof api.validateArtifact, "function")
	const artifact = {
		schemaVersion: 1,
		fingerprint: "a".repeat(64),
		text: "Hi",
		viewBox: [-5, -5, 30, 30],
		strokes: [{ d: "M0,0C1,1 2,2 3,3", duration: 0.2, delay: 0 }],
	}
	assert.deepEqual(api.validateArtifact(artifact, "a".repeat(64)), artifact)
	for (const patch of [
		{ schemaVersion: 2 },
		{ fingerprint: "bad" },
		{ viewBox: [0, 0, NaN, 4] },
		{ strokes: [{ d: "M0,0Z", duration: 1, delay: 0 }] },
		{ strokes: [{ d: "M0,0C1,1 2,2 3,3", duration: -1, delay: 0 }] },
		{ strokes: [{ d: "M0,0C1,1 2,2 3,3", duration: 1, delay: 10 }] },
		{ extra: true },
	])
		assert.throws(() => api.validateArtifact({ ...artifact, ...patch }))
	assert.throws(() => api.validateArtifact(artifact, "b".repeat(64)))
})
test("explicit null options are invalid rather than silently defaulted", () => {
	for (const key of ["style", "seed", "legibility"])
		assert.throws(() => api.normalizeInput({ text: "Hi", [key]: null }))
})
test("artifact validation rejects sparse stroke arrays and symbol keys", () => {
	const artifact = {
		schemaVersion: 1,
		fingerprint: "a".repeat(64),
		text: "Hi",
		viewBox: [-5, -5, 30, 30],
		strokes: Array(1),
	}
	assert.throws(() => api.validateArtifact(artifact))
	assert.throws(() => api.normalizeInput({ text: "Hi", [Symbol("extra")]: true }))
})
test("committed playback fixture matches the canonical default input", async () => {
	const { readFile } = await import("node:fs/promises")
	const value = JSON.parse(
		await readFile(new URL("../fixtures/hello-world.json", import.meta.url), "utf8")
	)
	assert.equal(
		api.validateArtifact(value, await api.fingerprint({ text: "Hello world" })).text,
		"Hello world"
	)
})
test("artifact rejects oversized paths, stroke counts, geometry and total payload", () => {
	const artifact = {
		schemaVersion: 1,
		fingerprint: "a".repeat(64),
		text: "Hi",
		viewBox: [-5, -5, 30, 30],
		strokes: [{ d: "M0,0C1,1 2,2 3,3", duration: 0.2, delay: 0 }],
	}
	assert.throws(
		() =>
			api.validateArtifact({
				...artifact,
				strokes: Array.from({ length: 2001 }, () => artifact.strokes[0]),
			}),
		/count/
	)
	assert.throws(
		() =>
			api.validateArtifact({
				...artifact,
				strokes: [{ d: "M0,0C1,1 2,2 999,999", duration: 0.2, delay: 0 }],
			}),
		/bounds/
	)
	assert.throws(
		() =>
			api.validateArtifact({
				...artifact,
				strokes: [{ d: "M0,0" + "C1,1 2,2 3,3".repeat(10000), duration: 0.2, delay: 0 }],
			}),
		/path/
	)
	assert.throws(
		() =>
			api.validateArtifact({
				...artifact,
				strokes: Array.from({ length: 1000 }, (_, index) => ({
					d: "M0,0" + "C1,1 2,2 3,3".repeat(100),
					duration: 0.01,
					delay: index * 0.01,
				})),
			}),
		/large/
	)
})
