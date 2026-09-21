import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
const api = await import("../dist/generator.js").catch(() => ({}))
const raw = await import("../dist/model.mjs")
const { collectPoints } = await import("../dist/sampling.js")
const geometry = await import("../dist/geometry.js").catch(() => ({}))

const shapes = {
	q: [1024],
	w: [1024, 768],
	e: [256],
	r: [1024, 512],
	t: [256],
	y: [1024, 512],
	u: [1],
	i: [3, 256],
	o: [256],
	p: [1024],
	a: [256],
	s: [85, 256],
	d: [256],
	f: [1024],
	g: [80, 64],
	h: [256, 30],
	j: [512, 256],
	k: [64, 256],
	l: [256, 512],
	z: [256, 121],
	x: [256],
	c: [256, 1],
	v: [121],
	b: [3, 256, 256],
	n: [30],
	m: [256],
	Q: [256],
	W: [256],
	E: [256],
	R: [256],
	T: [256],
}
function fixture(stop = -10) {
	const chunks = []
	for (const [name, shape] of Object.entries(shapes)) {
		const sparse = ["w", "r", "y", "l"].includes(name)
		const count = sparse ? 0 : shape.reduce((a, b) => a * b, 1)
		const buffer = new ArrayBuffer(8 + count * 4 + shape.length * 2)
		const view = new DataView(buffer)
		view.setUint8(0, 1)
		view.setUint8(1, name.charCodeAt(0))
		view.setUint8(2, sparse ? 1 : 0)
		view.setUint32(3, count, true)
		if (name === "u") view.setFloat32(7, stop, true)
		view.setUint8(7 + count * 4, shape.length)
		shape.forEach((size, index) => view.setUint16(8 + count * 4 + index * 2, size, true))
		chunks.push(new Uint8Array(buffer))
	}
	const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
	let offset = 0
	for (const chunk of chunks) {
		result.set(chunk, offset)
		offset += chunk.length
	}
	return result.buffer
}

test("internal tensor parser rejects malformed structure and nonfinite tensors", () => {
	const valid = fixture()
	assert.ok(raw.parseModel(valid))
	assert.throws(() => raw.parseModel(valid.slice(0, -1)), /Truncated/)
	const malformed = valid.slice(0)
	new DataView(malformed).setFloat32(7, Infinity, true)
	assert.throws(() => raw.parseModel(malformed), /Invalid tensor value/)
	assert.throws(() => raw.parseModel(new ArrayBuffer(9_000_000)), /size/)
})
test("sampling rejects incomplete, empty and cancelled results without making artifacts", async () => {
	const points = (text, stop = -10, signal) =>
		collectPoints(raw.generate(raw.parseModel(fixture(stop)), text), signal)
	await assert.rejects(points("A"), /complete/i)
	await assert.rejects(points("A", 10), /empty/i)
	const controller = new AbortController()
	controller.abort()
	await assert.rejects(points("A", -10, controller.signal), { name: "AbortError" })
	const during = new AbortController()
	const pending = points("Hello", -10, during.signal)
	setTimeout(() => during.abort(), 0)
	await assert.rejects(pending, { name: "AbortError" })
})
test("geometry encloses cubic controls and allocates proportional sequential times", () => {
	assert.equal(typeof geometry.buildGeometry, "function")
	const result = geometry.buildGeometry([
		[0, 0, 0],
		[1, 0, 0],
		[1, 20, 1],
		[10, 10, 0],
		[30, 10, 1],
	])
	assert.ok(result.viewBox[1] < -5)
	assert.equal(result.strokes[0].delay, 0)
	assert.equal(result.strokes[1].delay, result.strokes[0].duration)
	assert.ok(result.strokes.every((stroke) => stroke.duration > 0))
})
test("model download enforces URL and content bounds before parsing", async () => {
	assert.equal(typeof api.loadModel, "function")
	await assert.rejects(api.loadModel({ url: "file:///tmp/model" }), /HTTP/)
	const original = globalThis.fetch
	try {
		globalThis.fetch = async () =>
			new Response(new Uint8Array(16), { headers: { "content-length": "9000000" } })
		await assert.rejects(api.loadModel({ url: "https://example.com/model" }), /size/i)
		globalThis.fetch = async () => new Response(new Uint8Array(16))
		await assert.rejects(api.loadModel({ url: "https://example.com/model" }), /digest/i)
	} finally {
		globalThis.fetch = original
	}
})
test(
	"real pinned model produces reproducible valid seeded artifacts",
	{ skip: !process.env.HANDWRITING_TEST_MODEL },
	async () => {
		const bytes = await readFile(process.env.HANDWRITING_TEST_MODEL)
		const model = await api.parseModel(
			bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
		)
		const first = await api.generateHandwriting({ text: "Hi" }, { model })
		const second = await api.generateHandwriting({ text: "Hi" }, { model })
		const different = await api.generateHandwriting({ text: "Hi", seed: 43 }, { model })
		assert.deepEqual(first, second)
		assert.notDeepEqual(first.strokes, different.strokes)
		assert.ok(first.strokes.length > 0)
	}
)
test(
	"pinned model loads through verified fetch and supports every named style",
	{ skip: !process.env.HANDWRITING_TEST_MODEL },
	async () => {
		const { STYLES, MODEL_SHA256 } = await import("../dist/schema.js")
		const { createHash } = await import("node:crypto")
		const bytes = await readFile(process.env.HANDWRITING_TEST_MODEL)
		assert.equal(createHash("sha256").update(bytes).digest("hex"), MODEL_SHA256)
		const original = globalThis.fetch
		let model
		try {
			globalThis.fetch = async () => new Response(bytes)
			model = await api.loadModel({ url: "https://example.com/model" })
		} finally {
			globalThis.fetch = original
		}
		for (const { id } of STYLES) {
			const result = await api.generateHandwriting({ text: "Hello world", style: id }, { model })
			assert.equal(result.text, "Hello world")
			assert.ok(result.strokes.length > 0)
		}
	}
)
test("public parsing rejects structurally valid unpinned weights", async () => {
	await assert.rejects(async () => api.parseModel(fixture()), /digest/i)
})
test(
	"altered valid-format weights cannot generate the pinned fingerprint",
	{ skip: !process.env.HANDWRITING_TEST_MODEL },
	async () => {
		const bytes = await readFile(process.env.HANDWRITING_TEST_MODEL)
		const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
		const view = new DataView(buffer)
		view.setFloat32(7, view.getFloat32(7, true) + 0.125, true)
		assert.doesNotThrow(() => raw.parseModel(buffer))
		await assert.rejects(async () => api.parseModel(buffer), /digest/i)
	}
)
test(
	"verified model handles cannot be mutated or forged",
	{ skip: !process.env.HANDWRITING_TEST_MODEL },
	async () => {
		const bytes = await readFile(process.env.HANDWRITING_TEST_MODEL)
		const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
		const pending = api.parseModel(buffer)
		new Uint8Array(buffer).fill(0)
		const model = await pending
		const baseline = await api.generateHandwriting({ text: "Hi" }, { model })
		assert.ok(Object.isFrozen(model))
		assert.throws(() => {
			model.weights = raw.parseModel(fixture())
		}, TypeError)
		assert.deepEqual(await api.generateHandwriting({ text: "Hi" }, { model }), baseline)
		for (const forged of [{}, { ...model }, Object.create(model)]) {
			await assert.rejects(
				api.generateHandwriting({ text: "Hi" }, { model: forged }),
				/returned by/
			)
		}
	}
)
