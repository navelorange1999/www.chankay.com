import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useRef, useState } from "react"
import { HandWriting } from "@repo/ui"
import fixture from "@chankay/handwriting/fixtures/hello-world.json"
import {
	validateArtifact,
	normalizeInput,
	fingerprint,
	STYLES,
	type HandwritingArtifact,
	type StyleId,
} from "@chankay/handwriting/schema"
import type { HandwritingEngine } from "@chankay/handwriting/browser"

const defaultArtifact = validateArtifact(fixture)
const defaultMessage = "Default handwriting preview. Edit the text, then select Generate."
const actionClassName = "rounded-md border border-current px-3 py-2 text-sm disabled:opacity-40"

function HandwritingPlayground() {
	const [text, setText] = useState("Hello world")
	const [style, setStyle] = useState<StyleId>("rounded")
	const seed = useRef(42)
	const [speed, setSpeed] = useState(1)
	const [artifact, setArtifact] = useState<HandwritingArtifact | null>(defaultArtifact)
	const [message, setMessage] = useState(defaultMessage)
	const [busy, setBusy] = useState(false)
	const [replay, setReplay] = useState(0)
	const engine = useRef<Promise<HandwritingEngine> | null>(null)
	const revision = useRef(0)
	const cache = useRef(
		new Map<string, HandwritingArtifact>([[defaultArtifact.fingerprint, defaultArtifact]])
	)
	const modelUrl = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
		.VITE_HANDWRITING_MODEL_URL

	useEffect(() => {
		revision.current++
		void engine.current?.then((value) => value.cancel())
		const isDefault = text === defaultArtifact.text && style === "rounded" && seed.current === 42
		setArtifact(isDefault ? defaultArtifact : null)
		setBusy(false)
		setMessage(isDefault ? defaultMessage : "Select Generate to preview this text in handwriting.")
	}, [text, style])

	useEffect(
		() => () => {
			revision.current++
			void engine.current?.then((value) => value.dispose())
		},
		[]
	)

	async function generate(nextSeed = seed.current) {
		const current = ++revision.current
		try {
			const input = normalizeInput({ text, style, seed: nextSeed })
			setBusy(true)
			setArtifact(null)
			setMessage("Generating handwriting…")
			const key = await fingerprint(input)
			let result = cache.current.get(key)
			if (!result) {
				if (!modelUrl)
					throw new Error(
						"Live generation requires a configured model. See the SDK setup instructions."
					)
				if (!engine.current)
					engine.current = import("@chankay/handwriting/browser").then(
						({ HandwritingEngine }) => new HandwritingEngine({ modelUrl })
					)
				const ready = await engine.current
				if (revision.current !== current) return
				result = await ready.generate(input)
				if (cache.current.size >= 30) cache.current.delete(cache.current.keys().next().value!)
				cache.current.set(key, result)
			}
			if (revision.current !== current) return
			setArtifact(result)
			setMessage("Ready. Replay keeps the same handwriting; write again creates a variation.")
		} catch (error) {
			if (revision.current !== current) return
			setMessage(error instanceof Error ? error.message : "Generation failed. Try again.")
		} finally {
			if (revision.current === current) setBusy(false)
		}
	}

	return (
		<section
			style={{
				width: "100%",
				maxWidth: 720,
				margin: "0 auto",
				display: "grid",
				gap: 14,
				padding: 8,
			}}
		>
			<label>
				English text
				<input
					aria-label="English text"
					value={text}
					maxLength={50}
					onChange={(event) => setText(event.target.value)}
					style={{
						display: "block",
						width: "100%",
						padding: 10,
						color: "inherit",
						background: "transparent",
						border: "1px solid #888",
						borderRadius: 6,
					}}
				/>
			</label>
			<label>
				Handwriting style
				<select
					aria-label="Handwriting style"
					value={style}
					onChange={(event) => setStyle(event.target.value as StyleId)}
					style={{ marginLeft: 12, padding: 8 }}
				>
					{STYLES.map((item) => (
						<option key={item.id} value={item.id}>
							{item.label}
						</option>
					))}
				</select>
			</label>
			<label>
				Speed: {speed}×{" "}
				<input
					aria-label="Animation speed"
					type="range"
					min={0.1}
					max={3}
					step={0.1}
					value={speed}
					onChange={(event) => setSpeed(Number(event.target.value))}
				/>
			</label>
			<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
				<button
					className={actionClassName}
					type="button"
					disabled={busy}
					onClick={() => void generate()}
				>
					Generate
				</button>
				<button
					className={actionClassName}
					type="button"
					disabled={!artifact}
					onClick={() => setReplay((value) => value + 1)}
				>
					Replay
				</button>
				<button
					className={actionClassName}
					type="button"
					disabled={busy}
					onClick={() => {
						seed.current = (seed.current + 1) >>> 0
						void generate()
					}}
				>
					Write again
				</button>
			</div>
			<p role="status" aria-live="polite">
				{message}
			</p>
			<HandWriting
				key={`${artifact?.fingerprint}-${replay}`}
				text={artifact?.text ?? text}
				artifact={artifact}
				speed={speed}
				className="h-40 w-full"
			/>
		</section>
	)
}

const meta = {
	title: "Components/Text/HandWriting Playground",
	component: HandwritingPlayground,
	parameters: { layout: "padded" },
} satisfies Meta<typeof HandwritingPlayground>
export default meta
export const Playground: StoryObj<typeof meta> = {}
