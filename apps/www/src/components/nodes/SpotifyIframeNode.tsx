import * as React from "react"

import { SpotifyIframe } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type SpotifyIframeBlock = Extract<
	NonNullable<Page["structure"]>[number],
	{ blockType: "spotifyIframe" }
>

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

export interface SpotifyIframeNodeProps {
	block: SpotifyIframeBlock
}

export function SpotifyIframeNode({ block }: SpotifyIframeNodeProps) {
	const uri = asOptionalString(block.uri)
	const height = asNumber(block.height) ?? 352

	if (!uri) return null

	return (
		<div className="mx-auto w-full max-w-3xl">
			<SpotifyIframe uri={uri} height={height} />
		</div>
	)
}
