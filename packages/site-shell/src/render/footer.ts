import { BRAND_LOGO_URL, BRAND_NAME, MAIN_SITE_URL } from "../constants.js"

export function renderFooter(): string {
	const currentYear = new Date().getFullYear()

	return `
		<footer class="site-shell-footer">
			<div class="site-shell-container site-shell-footer-inner">
				<div class="site-shell-footer-bar">
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

					<p class="site-shell-copyright">© ${currentYear} ${BRAND_NAME}</p>
				</div>
			</div>
		</footer>
	`
}
