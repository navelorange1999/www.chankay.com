import {
	BRAND_LOGO_URL,
	BRAND_NAME,
	DEMOS_URL,
	FOOTER_NOTE,
	MAIN_SITE_URL,
	POSTS_URL,
} from "../constants.js"

export function renderFooter(): string {
	const currentYear = new Date().getFullYear()

	return `
		<footer class="site-shell-footer">
			<div class="site-shell-container site-shell-footer-inner">
				<div class="site-shell-footer-top">
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
						</span>
					</a>

					<nav class="site-shell-footer-links" aria-label="Chankay footer navigation">
						<a class="site-shell-link" href="${MAIN_SITE_URL}">Home</a>
						<a class="site-shell-link" href="${POSTS_URL}">Posts</a>
						<a class="site-shell-link" href="${DEMOS_URL}">Demos</a>
					</nav>
				</div>

				<div class="site-shell-footer-bottom">
					<p class="site-shell-footnote">${FOOTER_NOTE}</p>
					<p class="site-shell-copyright">© ${currentYear} ${BRAND_NAME}</p>
				</div>
			</div>
		</footer>
	`
}
