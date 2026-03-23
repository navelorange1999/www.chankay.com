import { renderSiteShell } from "../render/index.js"
import { siteShellStyles } from "../render/styles.js"
import { readSiteShellAttributes } from "../utils.js"

export class SiteShellElement extends HTMLElement {
	static observedAttributes = ["position", "repo-url", "site-name"]

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}

	connectedCallback() {
		this.render()
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (oldValue === newValue) {
			return
		}

		if (name === "position" || name === "repo-url" || name === "site-name") {
			this.render()
		}
	}

	private render() {
		if (!this.shadowRoot) {
			return
		}

		const attributes = readSiteShellAttributes(this)
		this.shadowRoot.innerHTML = `<style>${siteShellStyles}</style>${renderSiteShell(attributes)}`
	}
}
