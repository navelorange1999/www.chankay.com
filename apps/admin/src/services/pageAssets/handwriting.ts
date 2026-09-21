import { normalizeInput, type HandwritingInput } from "@chankay/handwriting/schema"
import { ensureHandwriting } from "../handwriting/service"
import { revalidateHandwriting } from "../handwriting/revalidate"

export function collectHandwritingInputs(structure: unknown): HandwritingInput[] {
	const inputs: HandwritingInput[] = []
	function visit(value: unknown, depth: number) {
		if (!Array.isArray(value) || depth > 8) return
		for (const item of value) {
			if (!item || typeof item !== "object") continue
			const block = item as Record<string, unknown>
			if (block.blockType === "handWriting") {
				inputs.push(
					normalizeInput({
						text: block.text ?? "Hello world",
						style: block.style ?? "rounded",
						seed: block.seed ?? 42,
						legibility: block.legibility ?? 0.85,
					})
				)
			}
			visit(block.children, depth + 1)
			visit(block.contentBlocks, depth + 1)
		}
	}
	visit(structure, 0)
	return inputs
}

export async function prepareHandwritingPage<T extends { structure?: unknown }>(
	initial: T,
	dependencies: {
		load: () => Promise<T | null>
		generate: (structure: unknown) => Promise<void>
	}
): Promise<T | null> {
	let current = initial
	for (let attempt = 0; attempt < 4; attempt++) {
		await dependencies.generate(current.structure)
		const latest = await dependencies.load()
		if (!latest) return null
		if (
			JSON.stringify(collectHandwritingInputs(current.structure)) ===
			JSON.stringify(collectHandwritingInputs(latest.structure))
		)
			return latest
		current = latest
	}
	throw new Error("Page changed during handwriting generation. Retry the job.")
}

export async function generatePageHandwriting(structure: unknown) {
	const keys: string[] = []
	for (const input of collectHandwritingInputs(structure)) {
		const artifact = await ensureHandwriting(input)
		keys.push(artifact.fingerprint)
	}
	await revalidateHandwriting(keys)
}
