"use client"

import * as React from "react"

import SpotifyIframeSkeleton from "./SpotifyIframeSkeleton"

type SpotifyPlaybackEvent = {
	data: {
		position: number
		duration: number
		isBuffering: boolean
		isPaused: boolean
		playingURI: string
	}
}

type SpotifyEmbedController = {
	play: () => void
	pause: () => void
	loadUri: (uri: string) => void
	addListener: (event: string, cb: (event: SpotifyPlaybackEvent) => void) => void
	removeListener: (event: string, cb?: (event: SpotifyPlaybackEvent) => void) => void
}

type SpotifyIframeApi = {
	createController: (
		element: HTMLElement,
		options: { width: string; height: string; uri: string; theme?: "light" | "dark" },
		callback: (controller: SpotifyEmbedController) => void
	) => void
}

declare global {
	interface Window {
		onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void
		SpotifyIframeApi?: SpotifyIframeApi
	}
}

export interface SpotifyIframeProps extends React.ComponentProps<"div"> {
	uri?: string
	height?: number
	theme?: "light" | "dark" | "system"
}

export default function SpotifyIframe({
	uri = "spotify:playlist:1QN4xOT2GOWvVpIBzqP9zb",
	height = 352,
	theme = "system",
	className,
	...props
}: SpotifyIframeProps) {
	const embedRef = React.useRef<HTMLDivElement | null>(null)
	const controllerRef = React.useRef<SpotifyEmbedController | null>(null)
	const playbackUpdateHandlerRef = React.useRef<((event: SpotifyPlaybackEvent) => void) | null>(
		null
	)

	const [iFrameAPI, setIFrameAPI] = React.useState<SpotifyIframeApi | null>(null)
	const [playerLoaded, setPlayerLoaded] = React.useState(false)
	const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

	React.useEffect(() => {
		const existing = document.getElementById("spotify-iframe-api")
		if (existing) {
			return
		}

		const script = document.createElement("script")
		script.id = "spotify-iframe-api"
		script.src = "https://open.spotify.com/embed/iframe-api/v1"
		script.async = true
		document.body.appendChild(script)
	}, [])

	React.useEffect(() => {
		if (iFrameAPI) {
			return
		}

		if (window.SpotifyIframeApi) {
			setIFrameAPI(window.SpotifyIframeApi)
			return
		}

		window.onSpotifyIframeApiReady = (SpotifyIframeApi: SpotifyIframeApi) => {
			window.SpotifyIframeApi = SpotifyIframeApi
			setIFrameAPI(SpotifyIframeApi)
		}
	}, [iFrameAPI])

	React.useEffect(() => {
		if (theme === "light" || theme === "dark") {
			setResolvedTheme(theme)
			return
		}

		const getThemeFromDom = () => {
			if (document.documentElement.classList.contains("dark")) {
				return "dark"
			}
			return "light"
		}

		setResolvedTheme(getThemeFromDom())

		const observer = new MutationObserver(() => {
			setResolvedTheme(getThemeFromDom())
		})

		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

		return () => {
			observer.disconnect()
		}
	}, [theme])

	React.useEffect(() => {
		if (!iFrameAPI || !embedRef.current) {
			return
		}

		embedRef.current.innerHTML = ""
		setPlayerLoaded(false)
		controllerRef.current = null
		playbackUpdateHandlerRef.current = null

		iFrameAPI.createController(
			embedRef.current,
			{
				width: "100%",
				height: String(height),
				uri,
				theme: resolvedTheme,
			},
			(spotifyEmbedController) => {
				controllerRef.current = spotifyEmbedController

				spotifyEmbedController.addListener("ready", () => {
					setPlayerLoaded(true)
				})

				const handlePlaybackUpdate = (event: SpotifyPlaybackEvent) => {
					void event
				}

				playbackUpdateHandlerRef.current = handlePlaybackUpdate
				spotifyEmbedController.addListener("playback_update", handlePlaybackUpdate)
			}
		)

		return () => {
			if (!controllerRef.current || !playbackUpdateHandlerRef.current) {
				return
			}
			controllerRef.current.removeListener("playback_update", playbackUpdateHandlerRef.current)
		}
	}, [height, iFrameAPI, resolvedTheme, uri])

	return (
		<div className={className} {...props}>
			<div className="relative" style={{ height }}>
				<div ref={embedRef} className={!playerLoaded ? "invisible" : undefined} />
				{!playerLoaded && (
					<div className="absolute inset-0">
						<SpotifyIframeSkeleton height={height} />
					</div>
				)}
			</div>
		</div>
	)
}
