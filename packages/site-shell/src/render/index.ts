import type { SiteShellAttributes } from "../types.js"
import { renderFooter } from "./footer.js"
import { renderNavbar } from "./navbar.js"

export function renderSiteShell(attributes: SiteShellAttributes): string {
	const sections: string[] = []

	if (attributes.position !== "footer") {
		sections.push(renderNavbar(attributes))
	}

	if (attributes.position !== "header") {
		sections.push(renderFooter())
	}

	return `<div class="site-shell-root">${sections.join("")}</div>`
}
