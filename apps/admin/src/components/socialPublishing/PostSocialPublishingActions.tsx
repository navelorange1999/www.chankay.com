"use client"

import { useEffect, useRef, useState } from "react"
import { useDocumentInfo, useLocale } from "@payloadcms/ui"

import { prepareDiagramAssets } from "./prepareDiagramAssets"
import { renderMermaidPng } from "@repo/ui/utils/mermaidPng"

export function PostSocialPublishingActions() {
	const { id } = useDocumentInfo()
	const locale = useLocale()
	const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
	const [media, setMedia] = useState<Array<{ id: string; filename: string }>>([])
	const [coverMediaId, setCoverMediaId] = useState("")
	const diagramCache = useRef(new Map<string, string>())
	const [accountId, setAccountId] = useState("")
	const [message, setMessage] = useState("")
	const [busy, setBusy] = useState(false)
	useEffect(() => {
		const controller = new AbortController()
		fetch("/api/social-accounts?limit=100&depth=0&where[enabled][equals]=true", {
			signal: controller.signal,
		})
			.then(async (response) => {
				if (!response.ok) throw new Error()
				const data = await response.json()
				setAccounts(data.docs)
			})
			.catch(() => {
				if (!controller.signal.aborted) setMessage("Unable to load social accounts.")
			})
		fetch("/api/media?limit=100&depth=0&sort=-createdAt&where[mimeType][in]=image/png,image/jpeg", {
			signal: controller.signal,
		})
			.then(async (response) => {
				if (!response.ok) throw new Error()
				const data = await response.json()
				setMedia(data.docs)
			})
			.catch(() => {
				if (!controller.signal.aborted) setMessage("Unable to load cover images.")
			})
		return () => controller.abort()
	}, [])
	async function prepare() {
		setBusy(true)
		setMessage("")
		try {
			setMessage("Rendering and uploading article diagrams…")
			const diagramImages = await prepareDiagramAssets(
				String(id),
				locale.code,
				renderMermaidPng,
				fetch,
				diagramCache.current
			)
			const response = await fetch("/api/social-publications/prepare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					postId: String(id),
					accountId,
					locale: locale.code,
					assets: { ...(coverMediaId ? { coverMediaId } : {}), diagramImages },
				}),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error?.code || "PREPARATION_FAILED")
			window.location.assign(
				`/collections/social-publications/${encodeURIComponent(data.publicationId)}`
			)
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Preparation failed.")
		} finally {
			setBusy(false)
		}
	}
	return (
		<section aria-label="Social publishing">
			<h3>Social publishing</h3>
			<p>Prepare the saved, published content for {locale.code}.</p>
			<label>
				Destination{" "}
				<select
					aria-label="Social account"
					value={accountId}
					onChange={(event) => setAccountId(event.target.value)}
				>
					<option value="">Select an account</option>
					{accounts.map((account) => (
						<option key={account.id} value={account.id}>
							{account.name}
						</option>
					))}
				</select>
			</label>
			<label>
				WeChat cover{" "}
				<select
					aria-label="WeChat cover"
					value={coverMediaId}
					onChange={(event) => setCoverMediaId(event.target.value)}
				>
					<option value="">Use published article cover</option>
					{media.map((asset) => (
						<option key={asset.id} value={asset.id}>
							{asset.filename}
						</option>
					))}
				</select>
			</label>
			<p>Mermaid diagrams are saved as images for review. The website article stays unchanged.</p>
			<button type="button" disabled={!id || !accountId || busy} onClick={prepare}>
				{busy ? "Preparing…" : "Prepare publication"}
			</button>
			{message && <p role="status">{message}</p>}
		</section>
	)
}
