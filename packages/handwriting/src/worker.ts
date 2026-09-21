import { createWorkerHandler } from "./workerRuntime.js"
const receive = createWorkerHandler((message) => globalThis.postMessage(message))
globalThis.addEventListener("message", (event: MessageEvent) => receive(event.data))
