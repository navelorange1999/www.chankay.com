import test from "node:test"
import assert from "node:assert/strict"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
const api = await import("../dist/react.js").catch(() => ({}))
const artifact = {
	schemaVersion: 1,
	fingerprint: "a".repeat(64),
	text: "Hi & hello",
	viewBox: [-5, -5, 30, 30],
	strokes: [
		{ d: "M0,0C1,1 2,2 3,3", duration: 0.2, delay: 0 },
		{ d: "M1,1l0.001,0", duration: 0.1, delay: 0.2 },
	],
}
test("SSR renderer has accessible escaped text, sequential animation and reduced motion", () => {
	assert.equal(typeof api.Handwriting, "function")
	const markup = renderToStaticMarkup(React.createElement(api.Handwriting, { artifact, speed: 2 }))
	assert.match(markup, /role="img"/)
	assert.match(markup, /aria-label="Hi &amp; hello"/)
	assert.match(markup, /pathLength="1"/)
	assert.match(markup, /prefers-reduced-motion/)
	assert.match(markup, /--chankay-handwriting-delay:0.1s/)
	assert.match(markup, /--chankay-handwriting-duration:0.05s/)
	const staticMarkup = renderToStaticMarkup(
		React.createElement(api.Handwriting, { artifact, animate: false })
	)
	assert.doesNotMatch(staticMarkup, /data-animated="true"/)
	assert.throws(
		() => renderToStaticMarkup(React.createElement(api.Handwriting, { artifact, speed: 0 })),
		/speed/i
	)
})
test("renderer supports the CMS playback speed range through ten", () => {
	assert.doesNotThrow(() =>
		renderToStaticMarkup(React.createElement(api.Handwriting, { artifact, speed: 10 }))
	)
})
