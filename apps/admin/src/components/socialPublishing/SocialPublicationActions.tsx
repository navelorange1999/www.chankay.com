"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth, useDocumentInfo } from "@payloadcms/ui"
import {
	canQueue,
	canRetryDraftAfterConnectivityFix,
	canRetryDraftAfterRemoteInspection,
	recoveryAction,
} from "../../services/socialPublishing/state"

type Review = {
	statusChecks?: number
	claimExpiresAt?: string | null
	capabilities: {
		remoteDraft: "required" | "optional" | "unsupported"
		asyncPublishStatus: boolean
	}
	publicationId: string
	status: string
	snapshotHash: string
	stale: boolean
	html: string
	preview: { title: string; summary: string; accountId: string; platform: string; locale: string }
	source: { providerAccountId: string }
	warnings: string[]
	remote?: {
		draftId?: string
		submissionId?: string
		publicationId?: string
		url?: string
		status?: string
		media?: Record<string, string>
	} | null
	lastError?: {
		code: string
		message: string
		stage: string
		retryable: boolean
		ambiguous: boolean
	} | null
}

export function SocialPublicationActions() {
	const { id } = useDocumentInfo()
	const { user } = useAuth()
	const [review, setReview] = useState<Review | null>(null)
	const [error, setError] = useState("")
	const [busy, setBusy] = useState(false)
	const status = review?.status
	const refresh = useCallback(async () => {
		if (!id) return
		const response = await fetch(
			`/api/social-publications/${encodeURIComponent(String(id))}/review`
		)
		if (!response.ok) throw new Error("Unable to load publication review.")
		setReview(await response.json())
	}, [id])
	useEffect(() => {
		refresh().catch(() => setError("Unable to load publication review."))
	}, [refresh])
	useEffect(() => {
		if (
			!status ||
			![
				"draft_queued",
				"draft_creating",
				"publish_queued",
				"publishing",
				"status_check_queued",
				"status_checking",
			].includes(status)
		)
			return
		const timer = setInterval(() => {
			refresh().catch(() => setError("Status refresh failed."))
		}, 5000)
		return () => clearInterval(timer)
	}, [status, refresh])
	async function command(action: "create-draft" | "publish") {
		if (!review) return
		if (
			action === "publish" &&
			!window.confirm(
				`Publish this exact snapshot externally?\n\n${review.preview.title}\nAccount: ${review.preview.accountId}\nProvider: ${review.source.providerAccountId}\nPlatform: ${review.preview.platform}\nLocale: ${review.preview.locale}\nSnapshot: ${review.snapshotHash}`
			)
		)
			return
		setBusy(true)
		setError("")
		try {
			const response = await fetch(`/api/social-publications/${action}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					publicationId: review.publicationId,
					expectedSnapshotHash: review.snapshotHash,
				}),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error?.code || "Publication command failed.")
			await refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Publication command failed.")
		} finally {
			setBusy(false)
		}
	}
	async function retryAfterRemoteInspection() {
		if (!review) return
		if (
			!window.confirm(
				"Confirm that you inspected the WeChat Official Account draft list and this article is not present. This will retry draft creation and may reuse media already uploaded during the interrupted attempt."
			)
		)
			return
		setBusy(true)
		setError("")
		try {
			const response = await fetch("/api/social-publications/retry-draft-after-remote-inspection", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					publicationId: review.publicationId,
					expectedSnapshotHash: review.snapshotHash,
					confirmedNoRemoteDraft: true,
				}),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error?.code || "Publication recovery failed.")
			await refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : "Publication recovery failed.")
		} finally {
			setBusy(false)
		}
	}
	if (!review) return <p role="status">{error || "Loading publication…"}</p>
	const recovery = recoveryAction(review)
	const connectivityRetry = canRetryDraftAfterConnectivityFix(review)
	const inspectedDraftRetry = canRetryDraftAfterRemoteInspection(review)
	return (
		<section aria-label="Publication review">
			<h2>{review.preview.title}</h2>
			<p>{review.preview.summary}</p>
			<p>
				{review.preview.platform} · {review.preview.locale} · {review.source.providerAccountId} ·{" "}
				{review.status}
			</p>
			<p>
				Snapshot: <code style={{ overflowWrap: "anywhere" }}>{review.snapshotHash}</code>
			</p>
			{review.stale && (
				<p role="status">
					Source content or settings have changed. Prepare a new publication before another external
					action.
				</p>
			)}
			{review.warnings.map((warning) => (
				<p key={warning}>{warning}</p>
			))}
			<iframe
				title="Prepared article preview"
				sandbox=""
				referrerPolicy="no-referrer"
				style={{ width: "100%", minHeight: 420, background: "white", border: "1px solid #aaa" }}
				srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width">${review.html}`}
			/>
			<details>
				<summary>Exact prepared HTML</summary>
				<pre style={{ whiteSpace: "pre-wrap" }}>{review.html}</pre>
			</details>
			{review.remote?.draftId && <p>Remote draft: {review.remote.draftId}</p>}
			{review.remote?.submissionId && <p>Submission: {review.remote.submissionId}</p>}
			{review.remote?.url && (
				<a href={review.remote.url} target="_blank" rel="noopener noreferrer">
					Open published article
				</a>
			)}
			{review.lastError && (
				<p role="status">
					{review.lastError.code}: {review.lastError.message}
					{review.lastError.ambiguous
						? " Inspect the remote account before any further action."
						: ""}
				</p>
			)}
			<button
				type="button"
				disabled={busy}
				onClick={() => refresh().catch(() => setError("Status refresh failed."))}
			>
				Refresh status
			</button>
			{canQueue(review, "create-draft", review.capabilities.remoteDraft) && (
				<button
					type="button"
					disabled={busy || review.stale}
					onClick={() => command("create-draft")}
				>
					{connectivityRetry ? "Retry draft after connectivity fix" : "Create remote draft"}
				</button>
			)}
			{user?.role === "admin" && canQueue(review, "publish", review.capabilities.remoteDraft) && (
				<button type="button" disabled={busy || review.stale} onClick={() => command("publish")}>
					Confirm and publish
				</button>
			)}
			{recovery && (recovery === "create-draft" || user?.role === "admin") && (
				<button type="button" disabled={busy} onClick={() => command(recovery)}>
					Resume queued work or status lookup
				</button>
			)}
			{inspectedDraftRetry && (
				<button type="button" disabled={busy || review.stale} onClick={retryAfterRemoteInspection}>
					Confirm no remote draft and retry
				</button>
			)}
			{error && <p role="alert">{error}</p>}
		</section>
	)
}
