"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useFormFields } from "@payloadcms/ui"
import { Handwriting } from "@chankay/handwriting/react"
import {
	fingerprint,
	normalizeInput,
	validateArtifact,
	type HandwritingArtifact,
} from "@chankay/handwriting/schema"

export default function HandwritingPreview({ path }: { path: string }) {
	const base = path.slice(0, path.lastIndexOf("."))
	const values = useFormFields(([fields]) => ({
		text: fields[`${base}.text`]?.value ?? "Hello world",
		style: fields[`${base}.style`]?.value ?? "rounded",
		seed: fields[`${base}.seed`]?.value ?? 42,
		legibility: fields[`${base}.legibility`]?.value ?? 0.85,
		speed: fields[`${base}.speed`]?.value ?? 1,
	}))
	const { dispatchFields, setModified } = useForm()
	const [artifact, setArtifact] = useState<HandwritingArtifact | null>(null)
	const [message, setMessage] = useState("Preparing preview…")
	const [retry, setRetry] = useState(0)
	const [replay, setReplay] = useState(0)
	const revision = useRef(0)
	const enteredSpeed = Number(values.speed)
	const previewSpeed = Number.isFinite(enteredSpeed)
		? Math.min(10, Math.max(0.1, enteredSpeed || 1))
		: 1
	const input = useMemo(() => {
		try {
			return normalizeInput({
				text: values.text,
				style: values.style,
				seed: values.seed,
				legibility: values.legibility,
			})
		} catch {
			return null
		}
	}, [values.text, values.style, values.seed, values.legibility])

	useEffect(() => {
		const current = ++revision.current
		const controller = new AbortController()
		setArtifact(null)
		if (!input) {
			setMessage("Enter 1–50 supported English characters to preview.")
			return
		}
		setMessage("Generating preview…")
		const timer = setTimeout(async () => {
			try {
				const key = await fingerprint(input)
				const response = await fetch("/api/handwriting/preview", {
					method: "POST",
					credentials: "same-origin",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
					signal: controller.signal,
				})
				if (!response.ok)
					throw new Error(
						response.status === 401
							? "Sign in again to preview."
							: "Preview unavailable. Check configuration or retry."
					)
				const result = validateArtifact(await response.json(), key)
				if (revision.current !== current || controller.signal.aborted) return
				setArtifact(result)
				setMessage("Preview ready. Save the page to apply your changes.")
			} catch (error) {
				if (controller.signal.aborted || revision.current !== current) return
				setMessage(error instanceof Error ? error.message : "Preview unavailable. Retry.")
			}
		}, 400)
		return () => {
			clearTimeout(timer)
			controller.abort()
			revision.current++
		}
	}, [input, retry])

	function reroll() {
		const seed = (Number(values.seed) + 1) >>> 0
		dispatchFields({ type: "UPDATE", path: `${base}.seed`, value: seed })
		setModified(true)
	}

	return (
		<section aria-label="Handwriting preview" style={{ marginBottom: 24 }}>
			<div
				style={{
					height: 180,
					display: "grid",
					placeItems: "center",
					border: "1px solid var(--theme-elevation-200)",
					borderRadius: 8,
					padding: 16,
				}}
			>
				{artifact ? (
					<Handwriting
						key={`${artifact.fingerprint}-${replay}`}
						artifact={artifact}
						speed={previewSpeed}
						style={{ width: "100%", height: "100%" }}
					/>
				) : (
					<span style={{ opacity: 0.6 }}>Handwriting preview</span>
				)}
			</div>
			<p role="status" aria-live="polite" style={{ fontSize: 13 }}>
				{message}
			</p>
			<div style={{ display: "flex", gap: 12 }}>
				<button type="button" disabled={!artifact} onClick={() => setReplay((value) => value + 1)}>
					Replay
				</button>
				<button type="button" disabled={!input} onClick={reroll}>
					Write again
				</button>
				<button type="button" disabled={!input} onClick={() => setRetry((value) => value + 1)}>
					Retry preview
				</button>
			</div>
		</section>
	)
}
