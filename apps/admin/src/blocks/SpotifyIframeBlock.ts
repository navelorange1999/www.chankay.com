import type { BlockDefinition } from "./types"

export const SpotifyIframeBlock: BlockDefinition = {
	slug: "spotifyIframe",
	labels: {
		singular: "Spotify Iframe",
		plural: "Spotify Iframes",
	},
	fields: [
		{
			name: "uri",
			type: "text",
			label: "URI",
			required: true,
			admin: {
				description:
					"Spotify URI (e.g. spotify:playlist:..., spotify:album:..., spotify:track:...)",
			},
		},
		{
			name: "height",
			type: "number",
			label: "Height",
			defaultValue: 352,
			min: 120,
			max: 1200,
			admin: {
				description: "Iframe height in pixels",
			},
		},
	],
}
