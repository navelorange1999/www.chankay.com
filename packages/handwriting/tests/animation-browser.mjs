import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Handwriting } from "../dist/react.js"

const artifact = JSON.parse(
	await readFile(new URL("../fixtures/hello-world.json", import.meta.url))
)
const render = (animate) =>
	renderToStaticMarkup(React.createElement(Handwriting, { artifact, animate }))
const html = `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Handwriting animation regression</title>
<style>body { font: 16px system-ui; margin: 32px; } svg { width: 600px; max-width: 100%; }</style>
<h1>Handwriting animation regression</h1><pre id="result">Running…</pre>
<h2>Paused partway through writing</h2><div id="animated">${render(true)}</div>
<h2>Static playback</h2><div id="static">${render(false)}</div>
<script>
const failures = [];
const check = (condition, label) => { if (!condition) failures.push(label); };
const paths = [...document.querySelectorAll('#animated path')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
for (const [index, path] of paths.entries()) {
  const animations = path.getAnimations();
  if (reduced) {
    check(animations.length === 0, 'Reduced motion must disable animation');
    check(getComputedStyle(path).visibility === 'visible', 'Reduced motion must show every stroke');
    continue;
  }
  check(animations.length === 1, 'Expected a drawing animation for stroke ' + index);
  const animation = animations[0];
  if (!animation) continue;
  animation.pause();
  const { delay, duration } = animation.effect.getTiming();
  if (delay > 0) {
    animation.currentTime = delay - 1;
    check(getComputedStyle(path).visibility === 'hidden', 'Waiting stroke ' + index + ' must hide its round caps');
  }
  animation.currentTime = delay + duration / 2;
  check(getComputedStyle(path).visibility === 'visible', 'Active stroke ' + index + ' must be visible');
  animation.currentTime = delay + duration + 1;
  check(getComputedStyle(path).visibility === 'visible', 'Finished stroke ' + index + ' must remain visible');
  check(Number.parseFloat(getComputedStyle(path).strokeDashoffset) === 0, 'Finished stroke must be fully drawn');
}
for (const path of document.querySelectorAll('#static path')) {
  check(getComputedStyle(path).visibility === 'visible', 'Static strokes must remain visible beside animated strokes');
  check(path.getAnimations().length === 0, 'Static strokes must not animate');
}
document.querySelector('#result').textContent = failures.length ? 'FAIL\\n' + failures.join('\\n') : 'PASS: waiting, active, finished and static strokes';
for (const path of paths) for (const animation of path.getAnimations()) animation.currentTime = 400;
</script></html>`

createServer((request, response) => {
	if (request.url !== "/") {
		response.writeHead(404).end()
		return
	}
	response.writeHead(200, {
		"Content-Type": "text/html; charset=utf-8",
		"Cache-Control": "no-store",
	})
	response.end(html)
}).listen(8767, "127.0.0.1", () => {
	console.log("Open http://127.0.0.1:8767 to run the real-browser animation regression.")
})
