import { SITE_SHELL_TAG_NAME } from "./constants.js"
import { defineSiteShellElement } from "./custom-element/register.js"
import type { MountSiteShellOptions } from "./types.js"
import { normalizeSiteShellPosition, resolveMountTarget } from "./utils.js"

export function mountSiteShell({
	target,
	siteName,
	repoUrl,
	position,
}: MountSiteShellOptions): HTMLElement {
	defineSiteShellElement()

	const container = resolveMountTarget(target)
	const element = document.createElement(SITE_SHELL_TAG_NAME)
	const normalizedPosition = normalizeSiteShellPosition(position)

	element.setAttribute("position", normalizedPosition)

	if (siteName?.trim()) {
		element.setAttribute("site-name", siteName.trim())
	}

	if (repoUrl?.trim()) {
		element.setAttribute("repo-url", repoUrl.trim())
	}

	container.appendChild(element)

	return element
}
