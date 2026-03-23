import {
	BRAND_LOGO_URL,
	BRAND_NAME,
	DEMOS_URL,
	GITHUB_ICON_SVG,
	MAIN_SITE_URL,
	POSTS_URL,
} from "../constants.js"
import type { SiteShellAttributes } from "../types.js"
import { escapeHtml } from "../utils.js"

function renderSiteName(siteName: SiteShellAttributes["siteName"]) {
	if (!siteName) {
		return ""
	}

	return `<span class="site-shell-site-name">${escapeHtml(siteName)}</span>`
}

function renderRepoLink(repoUrl: SiteShellAttributes["repoUrl"]) {
	if (!repoUrl) {
		return ""
	}

	return `
		<a
			class="site-shell-icon-link"
			href="${repoUrl}"
			target="_blank"
			rel="noreferrer noopener"
			aria-label="Open the demo repository on GitHub"
			title="Open the demo repository on GitHub"
		>
			${GITHUB_ICON_SVG}
		</a>
	`
}

export function renderNavbar(attributes: SiteShellAttributes): string {
	return `
		<header class="site-shell-header">
			<div class="site-shell-container site-shell-header-inner">
				<a class="site-shell-brand" href="${MAIN_SITE_URL}" aria-label="${BRAND_NAME} home">
					<img
						class="site-shell-brand-logo"
						src="${BRAND_LOGO_URL}"
						alt="${BRAND_NAME} logo"
						loading="lazy"
						decoding="async"
					/>
					<span class="site-shell-brand-copy">
						<span class="site-shell-brand-name">${BRAND_NAME}</span>
						${renderSiteName(attributes.siteName)}
					</span>
				</a>

				<nav class="site-shell-nav" aria-label="Chankay demo navigation">
					<a class="site-shell-link" href="${POSTS_URL}">Posts</a>
					<a class="site-shell-link" href="${DEMOS_URL}">Demos</a>
					${renderRepoLink(attributes.repoUrl)}
				</nav>
			</div>
		</header>
	`
}
