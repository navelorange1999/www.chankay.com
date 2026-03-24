import assert from "node:assert/strict"
import test from "node:test"

import { renderSiteShell } from "../dist/render/index.js"
import { siteShellStyles } from "../dist/render/styles.js"
import {
	asOptionalHttpUrl,
	normalizeSiteShellPosition,
	readSiteShellAttributes,
} from "../dist/utils.js"

test("renderSiteShell includes the fixed Chankay links and escaped site name", () => {
	const html = renderSiteShell({
		position: "both",
		repoUrl: "https://github.com/chankay/bezier-demo",
		siteName: "Bezier <Lab>",
	})

	assert.match(html, /https:\/\/chankay\.com\/posts/)
	assert.match(html, /https:\/\/chankay\.com\/demos/)
	assert.match(html, /Bezier &lt;Lab&gt;/)
	assert.match(html, /Open the demo repository on GitHub/)
	assert.match(html, /site-shell-brand-logo/)
	assert.doesNotMatch(html, /https:\/\/chankay\.com\/favicon\/website-logo\.svg/)
	assert.match(siteShellStyles, /\/favicon\/website-logo\.svg/)
	assert.match(siteShellStyles, /--site-shell-brand-logo-url/)
	assert.doesNotMatch(siteShellStyles, /data:image\//)
})

test("renderSiteShell omits the header when the footer-only position is selected", () => {
	const html = renderSiteShell({
		position: "footer",
		repoUrl: null,
		siteName: null,
	})

	assert.doesNotMatch(html, /site-shell-header/)
	assert.match(html, /site-shell-footer/)
})

test("renderSiteShell footer stays compact and does not repeat top navigation", () => {
	const html = renderSiteShell({
		position: "both",
		repoUrl: null,
		siteName: "Bezier Visualizer",
	})

	assert.doesNotMatch(html, /Chankay footer navigation/)
	assert.doesNotMatch(html, /Shared navigation shell for Chankay demo projects\./)
	assert.match(html, /© \d{4} Chan Kay/)
})

test("helpers normalize position and discard invalid repository URLs", () => {
	assert.equal(normalizeSiteShellPosition("Header"), "header")
	assert.equal(normalizeSiteShellPosition("invalid-value"), "both")
	assert.equal(asOptionalHttpUrl("javascript:alert(1)"), null)
	assert.equal(
		asOptionalHttpUrl("https://github.com/chankay/demo"),
		"https://github.com/chankay/demo"
	)
})

test("readSiteShellAttributes trims values and falls back to the default position", () => {
	const attributes = readSiteShellAttributes({
		getAttribute(name) {
			switch (name) {
				case "position":
					return "unknown"
				case "repo-url":
					return " https://github.com/chankay/demo "
				case "site-name":
					return " Demo Name "
				default:
					return null
			}
		},
	})

	assert.deepEqual(attributes, {
		position: "both",
		repoUrl: "https://github.com/chankay/demo",
		siteName: "Demo Name",
	})
})
