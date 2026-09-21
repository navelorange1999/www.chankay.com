export const SCHEMA_VERSION = 1 as const
export const GENERATOR_VERSION = "1"
export const GEOMETRY_VERSION = "1"
export const MODEL_SHA256 = "7e804513606e17704d8766ab9e7929fcc8fa7d2dd19c03385bba35373b50a79d"
export const STYLES = [
	{ id: "slender", label: "01 Slender" },
	{ id: "casual", label: "02 Casual" },
	{ id: "clear", label: "03 Clear" },
	{ id: "letter", label: "04 Letter" },
	{ id: "note", label: "05 Note" },
	{ id: "slanted", label: "06 Slanted" },
	{ id: "airy", label: "07 Airy" },
	{ id: "flowing", label: "08 Flowing" },
	{ id: "rounded", label: "09 Rounded" },
] as const
export type StyleId = (typeof STYLES)[number]["id"]
export interface HandwritingInput {
	text: string
	style?: StyleId
	seed?: number
	legibility?: number
}
export type NormalizedInput = Required<HandwritingInput>
export interface HandwritingArtifact {
	schemaVersion: typeof SCHEMA_VERSION
	fingerprint: string
	text: string
	viewBox: [number, number, number, number]
	strokes: { d: string; duration: number; delay: number }[]
}
export const SUPPORTED_CHARACTERS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \"'.,-?!;:()/#+*&[]"
export const MAX_ARTIFACT_BYTES = 1_000_000
const supported = new Set(SUPPORTED_CHARACTERS)
function record(value: unknown, keys: string[]): Record<string, unknown> {
	if (
		!value ||
		typeof value !== "object" ||
		Array.isArray(value) ||
		Reflect.ownKeys(value).some((key) => typeof key !== "string" || !keys.includes(key))
	)
		throw new Error("Invalid object properties.")
	return value as Record<string, unknown>
}
export function normalizeInput(value: unknown): NormalizedInput {
	const input = record(value, ["text", "style", "seed", "legibility"])
	if (
		typeof input.text !== "string" ||
		input.text.length > 500 ||
		[...input.text].some((character) => !supported.has(character))
	)
		throw new Error("Use English letters, numbers, spaces, and supported punctuation on one line.")
	const text = input.text.replace(/ +/g, " ").trim()
	if (!text || text.length > 50) throw new Error("Text must contain 1 to 50 characters.")
	const style = input.style === undefined ? "rounded" : input.style,
		seed = input.seed === undefined ? 42 : input.seed,
		legibility = input.legibility === undefined ? 0.85 : input.legibility
	if (!STYLES.some((item) => item.id === style)) throw new Error("Unknown handwriting style.")
	if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
		throw new Error("Seed must be an unsigned 32-bit integer.")
	if (
		typeof legibility !== "number" ||
		!Number.isFinite(legibility) ||
		legibility < 0.15 ||
		legibility > 2.5
	)
		throw new Error("Legibility must be between 0.15 and 2.5.")
	return { text, style: style as StyleId, seed, legibility }
}
export async function fingerprint(input: unknown): Promise<string> {
	const canonical = JSON.stringify({
		schema: SCHEMA_VERSION,
		model: MODEL_SHA256,
		generator: GENERATOR_VERSION,
		geometry: GEOMETRY_VERSION,
		input: normalizeInput(input),
	})
	const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
	return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
const numeric = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,3})?"
const pair = `${numeric},${numeric}`
const pathGrammar = new RegExp(`^M${pair}(?:l0\\.001,0|(?:C${pair} ${pair} ${pair})+)$`)
function finite(value: unknown, minimum: number, maximum: number): value is number {
	return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
}
export function validateArtifact(
	value: unknown,
	expectedFingerprint?: string
): HandwritingArtifact {
	const artifact = record(value, ["schemaVersion", "fingerprint", "text", "viewBox", "strokes"])
	if (
		artifact.schemaVersion !== SCHEMA_VERSION ||
		typeof artifact.fingerprint !== "string" ||
		!/^[a-f0-9]{64}$/.test(artifact.fingerprint) ||
		(expectedFingerprint !== undefined && artifact.fingerprint !== expectedFingerprint)
	)
		throw new Error("Invalid artifact version or fingerprint.")
	if (normalizeInput({ text: artifact.text }).text !== artifact.text)
		throw new Error("Artifact text must be normalized.")
	if (
		!Array.isArray(artifact.viewBox) ||
		artifact.viewBox.length !== 4 ||
		!artifact.viewBox.every((entry) => finite(entry, -100_000, 100_000)) ||
		artifact.viewBox[2] <= 0 ||
		artifact.viewBox[3] <= 0
	)
		throw new Error("Invalid artifact viewBox.")
	if (
		!Array.isArray(artifact.strokes) ||
		artifact.strokes.length < 1 ||
		artifact.strokes.length > 2000
	)
		throw new Error("Invalid artifact stroke count.")
	let end = 0,
		bytes = 256
	const [minX, minY, width, height] = artifact.viewBox as number[]
	const strokes = Array.from(artifact.strokes, (value) => {
		const stroke = record(value, ["d", "duration", "delay"])
		if (typeof stroke.d !== "string" || stroke.d.length > 100_000 || !pathGrammar.test(stroke.d))
			throw new Error("Invalid stroke path.")
		bytes += stroke.d.length + 128
		if (bytes > MAX_ARTIFACT_BYTES) throw new Error("Artifact is too large.")
		const coordinates = stroke.d
			.replace(/l0\.001,0$/, "")
			.match(/-?\d+(?:\.\d+)?/g)!
			.map(Number)
		for (let index = 0; index < coordinates.length; index += 2) {
			const x = coordinates[index]!,
				y = coordinates[index + 1]!
			if (!finite(x, minX!, minX! + width!) || !finite(y, minY!, minY! + height!))
				throw new Error("Stroke coordinates exceed artifact bounds.")
		}
		if (
			!finite(stroke.duration, 0.001, 60) ||
			!finite(stroke.delay, 0, 300) ||
			Math.abs(stroke.delay - end) > 0.001
		)
			throw new Error("Invalid stroke timing.")
		end = stroke.delay + stroke.duration
		if (end > 300) throw new Error("Artifact animation is too long.")
		return { d: stroke.d, duration: stroke.duration, delay: stroke.delay }
	})
	return {
		schemaVersion: SCHEMA_VERSION,
		fingerprint: artifact.fingerprint,
		text: artifact.text as string,
		viewBox: [...artifact.viewBox] as HandwritingArtifact["viewBox"],
		strokes,
	}
}
