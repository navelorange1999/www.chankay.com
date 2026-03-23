export type SiteShellPosition = "both" | "header" | "footer"

export interface SiteShellAttributes {
	position: SiteShellPosition
	repoUrl: string | null
	siteName: string | null
}

export interface MountSiteShellOptions {
	position?: SiteShellPosition
	repoUrl?: string | null
	siteName?: string | null
	target: Element | string
}
