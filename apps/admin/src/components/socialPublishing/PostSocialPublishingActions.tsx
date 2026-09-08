"use client"

import { useEffect, useState } from "react"
import { useDocumentInfo, useLocale } from "@payloadcms/ui"

export function PostSocialPublishingActions() {
	const { id } = useDocumentInfo()
	const locale = useLocale()
	const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
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
		return () => controller.abort()
	}, [])
	async function prepare() {
		setBusy(true)
		setMessage("")
		try {
			const response = await fetch("/api/social-publications/prepare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ postId: String(id), accountId, locale: locale.code }),
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
			<button type="button" disabled={!id || !accountId || busy} onClick={prepare}>
				{busy ? "Preparing…" : "Prepare publication"}
			</button>
			{message && <p role="status">{message}</p>}
		</section>
	)
}
