// @vitest-environment happy-dom
import { webcrypto } from "node:crypto"
import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fixture from "@chankay/handwriting/fixtures/hello-world.json"
import { fingerprint } from "@chankay/handwriting/schema"
import HandwritingPreview from "../HandwritingPreview"

const form = vi.hoisted(() => ({
	fields: {} as Record<string, { value: unknown }>,
	dispatch: vi.fn(),
	modified: vi.fn(),
}))
vi.mock("@payloadcms/ui", () => ({
	useFormFields: (select: (value: [typeof form.fields]) => unknown) => select([form.fields]),
	useForm: () => ({ dispatchFields: form.dispatch, setModified: form.modified }),
}))

let root: Root
let element: HTMLDivElement
const render = () =>
	act(async () => {
		root.render(createElement(HandwritingPreview, { path: "structure.0.handwritingPreview" }))
	})
const flush = () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 450))
	})

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
	vi.stubGlobal("crypto", webcrypto)
	form.fields = { "structure.0.text": { value: "Hello world" }, "structure.0.speed": { value: 1 } }
	form.dispatch.mockClear()
	form.modified.mockClear()
	element = document.createElement("div")
	document.body.append(element)
	root = createRoot(element)
})
afterEach(async () => {
	await act(async () => root.unmount())
	element.remove()
	vi.unstubAllGlobals()
})

describe("CMS handwriting preview", () => {
	it("previews unsaved text and tolerates intermediate speed values without saving the form", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture })
		vi.stubGlobal("fetch", fetch)
		await render()
		await flush()
		expect(element.querySelectorAll("svg path").length).toBeGreaterThan(0)
		for (const speed of [0, 11, "", Number.NaN]) {
			form.fields["structure.0.speed"] = { value: speed }
			await render()
			expect(element.querySelectorAll("svg path").length).toBeGreaterThan(0)
		}
		expect(fetch).toHaveBeenCalledTimes(1)
		expect(form.dispatch).not.toHaveBeenCalled()
		expect(form.modified).not.toHaveBeenCalled()
	})

	it("ignores a late response for the previous text", async () => {
		let resolveOld: (value: unknown) => void = () => {}
		const newer = {
			...fixture,
			text: "Welcome home",
			fingerprint: await fingerprint({ text: "Welcome home" }),
		}
		const fetch = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve
					})
			)
			.mockResolvedValueOnce({ ok: true, json: async () => newer })
		vi.stubGlobal("fetch", fetch)
		await render()
		await flush()
		form.fields["structure.0.text"] = { value: "Welcome home" }
		await render()
		await flush()
		await act(async () => resolveOld({ ok: true, json: async () => fixture }))
		expect(element.querySelector("svg")?.getAttribute("aria-label")).toBe("Welcome home")
	})

	it("replays without generating and rerolls by changing only the unsaved seed", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture })
		vi.stubGlobal("fetch", fetch)
		await render()
		await flush()
		const buttons = [...element.querySelectorAll("button")]
		await act(async () => buttons.find((button) => button.textContent === "Replay")!.click())
		expect(fetch).toHaveBeenCalledTimes(1)
		await act(async () => buttons.find((button) => button.textContent === "Write again")!.click())
		expect(form.dispatch).toHaveBeenCalledWith({
			type: "UPDATE",
			path: "structure.0.seed",
			value: 43,
		})
		expect(form.modified).toHaveBeenCalledWith(true)
	})
})
