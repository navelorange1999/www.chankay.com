import test from "node:test"
import assert from "node:assert/strict"
import { fingerprint } from "../dist/schema.js"
const api = await import("../dist/browser.js").catch(() => ({}))
const runtime = await import("../dist/workerRuntime.js").catch(() => ({}))
class FakeWorker {
	static instances = []
	listeners = {}
	sent = []
	terminated = false
	constructor(url, options) {
		this.url = url
		this.options = options
		this.generated = new Promise((resolve) => {
			this.onGenerate = resolve
		})
		FakeWorker.instances.push(this)
	}
	addEventListener(type, callback) {
		this.listeners[type] = callback
	}
	postMessage(data) {
		this.sent.push(data)
		if (data.type === "generate") this.onGenerate(data)
	}
	terminate() {
		this.terminated = true
	}
	message(data) {
		this.listeners.message({ data })
	}
}
const artifact = async (text) => ({
	schemaVersion: 1,
	fingerprint: await fingerprint({ text }),
	text,
	viewBox: [-5, -5, 20, 20],
	strokes: [{ d: "M0,0l0.001,0", delay: 0, duration: 0.1 }],
})
test("engine cancels earlier requests, rejects stale results and terminates pending work", async () => {
	assert.equal(typeof api.HandwritingEngine, "function")
	const original = globalThis.Worker
	globalThis.Worker = FakeWorker
	try {
		const engine = new api.HandwritingEngine({ modelUrl: "https://example.com/model" })
		const worker = FakeWorker.instances.at(-1)
		assert.equal(worker.sent.length, 0)
		assert.ok(worker.url.pathname.endsWith("/worker.js"))
		const first = engine.generate({ text: "First" })
		const rejected = assert.rejects(first, { name: "AbortError" })
		const second = engine.generate({ text: "Second" })
		await rejected
		const request = await worker.generated
		worker.message({
			type: "result",
			id: request.id - 1,
			version: request.version,
			artifact: await artifact("First"),
		})
		worker.message({
			type: "result",
			id: request.id,
			version: request.version,
			artifact: await artifact("Second"),
		})
		assert.equal((await second).text, "Second")
		const third = engine.generate({ text: "Third" })
		const disposed = assert.rejects(third, { name: "AbortError" })
		engine.dispose()
		await disposed
		assert.equal(worker.terminated, true)
		await assert.rejects(engine.generate({ text: "Fourth" }), /disposed/i)
	} finally {
		globalThis.Worker = original
	}
})
test("worker does not continue stale generation after model download finishes", async () => {
	assert.equal(typeof runtime.createWorkerHandler, "function")
	const sent = [],
		loads = [],
		generated = []
	let complete
	const done = new Promise((resolve) => {
		complete = resolve
	})
	const handler = runtime.createWorkerHandler(
		(message) => {
			sent.push(message)
			complete()
		},
		{
			loadModel: ({ signal }) => new Promise((resolve) => loads.push({ signal, resolve })),
			generateHandwriting: async (input) => {
				generated.push(input.text)
				return artifact(input.text)
			},
		}
	)
	const version = runtime.PROTOCOL_VERSION
	handler({
		type: "generate",
		id: 1,
		version,
		url: "https://example.com/model",
		input: { text: "First" },
	})
	handler({
		type: "generate",
		id: 2,
		version,
		url: "https://example.com/model",
		input: { text: "Second" },
	})
	assert.equal(loads[0].signal.aborted, true)
	loads[0].resolve({})
	loads[1].resolve({})
	await done
	assert.deepEqual(generated, ["Second"])
	assert.equal(sent.length, 1)
	assert.equal(sent[0].id, 2)
})
