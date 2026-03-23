import { SITE_SHELL_TAG_NAME } from "../constants.js"
import { SiteShellElement } from "./SiteShellElement.js"

export function defineSiteShellElement() {
	if (typeof customElements === "undefined") {
		throw new Error("Custom Elements are not available in the current runtime.")
	}

	if (!customElements.get(SITE_SHELL_TAG_NAME)) {
		customElements.define(SITE_SHELL_TAG_NAME, SiteShellElement)
	}
}
