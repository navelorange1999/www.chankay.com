"use client"

import { useSyncExternalStore } from "react"

import dynamic from "next/dynamic"

import type { HeatmapProps } from "@repo/ui/components/Heatmap"

const Heatmap = dynamic(
	() => import("@repo/ui/components/Heatmap").then((module) => module.Heatmap),
	{
		ssr: false,
		loading: () => <></>,
	}
)

const MOBILE_QUERY = "(width < 768px)"

function subscribeToMobileViewport(onChange: () => void) {
	const query = window.matchMedia(MOBILE_QUERY)
	query.addEventListener("change", onChange)
	return () => query.removeEventListener("change", onChange)
}

function getMobileSnapshot() {
	return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
	return false
}

export function HeatmapClient(props: HeatmapProps) {
	const isMobile = useSyncExternalStore(
		subscribeToMobileViewport,
		getMobileSnapshot,
		getServerSnapshot
	)

	return <Heatmap {...props} orientation={isMobile ? "vertical" : props.orientation} />
}
