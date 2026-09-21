# @chankay/handwriting

Private, deterministic handwriting inference and SVG playback. Model weights are not included. Production must explicitly inject a permitted model URL; no external production URL is built in. Model redistribution and usage rights require separate approval before distributing weights or making this package public.

## Entry points

- `@chankay/handwriting/schema`: shared input validation, named styles, versioned fingerprints, and bounded SVG artifact validation. No inference imports.
- `@chankay/handwriting/generator`: `loadModel({ url, signal })`, `await parseModel(arrayBuffer)`, and `generateHandwriting(input, { model, signal })`.
- `@chankay/handwriting/browser`: `new HandwritingEngine({ modelUrl })`, with `generate(input)`, `cancel()`, and `dispose()`. Downloads weights lazily on generation in a module worker.
- `@chankay/handwriting/react`: server-renderable `Handwriting` SVG. Accepts `artifact`, `speed` (0.1–10), `animate`, `strokeWidth` (0.1–3), `className`, and `style`. Honors reduced motion without JavaScript.
- `@chankay/handwriting/fixtures/hello-world.json`: generated playback fixture with no model weights.

There is deliberately no root barrel. Applications that only render saved artifacts should import `/schema` and `/react`; they do not need model code or a worker.

## Generation

```ts
import { loadModel, generateHandwriting } from "@chankay/handwriting/generator"

const model = await loadModel({ url: configuredModelUrl, signal })
const artifact = await generateHandwriting(
  { text: "Hello world", style: "rounded", seed: 42, legibility: 0.85 },
  { model, signal }
)
```

Text is one line of 1–50 supported ASCII characters after trimming and collapsing ASCII spaces. Newlines and tabs are rejected. Defaults are rounded style, seed 42, and legibility 0.85. Seed must be an unsigned 32-bit integer; legibility must be 0.15–2.5. Rendering options do not change the artifact fingerprint.

`loadModel` accepts HTTP(S) URLs (browser-relative URLs are allowed) and caps downloads at 8 MB. Both `loadModel` and the asynchronous `parseModel` verify the schema's pinned SHA-256 before parsing. `parseModel` takes a private snapshot of the supplied buffer before verification, so subsequent caller mutations cannot replace the verified weights. Parsed model handles are frozen and opaque; their tensors cannot be modified through the public API. Structurally valid weights from another model are rejected.

Generation yields to the event loop every eight points. Cancellation rejects with `AbortError`; incomplete and empty generations reject rather than returning partial artifacts. The worker aborts obsolete downloads and generations and discards late results.

Artifacts use only bounded `M`, `C`, and a single-point `l0.001,0` path grammar. Bounds include cubic control points and padding. Stroke durations are in seconds at speed 1, proportional to approximate curve length, with a minimum dot duration. Delays make playback sequential. Consumers should call `validateArtifact(value, expectedFingerprint)` at cache or network boundaries before rendering.

## Maintenance and verification

Increment `GENERATOR_VERSION` or `GEOMETRY_VERSION` when an implementation change affects generated artifacts. Updating weights also requires updating `MODEL_SHA256`. These values are part of both fingerprints and the worker protocol version.

```sh
pnpm --filter @chankay/handwriting build
pnpm --filter @chankay/handwriting check-types
pnpm --filter @chankay/handwriting test:run
```

For the SVG animation regression, run `node packages/handwriting/tests/animation-browser.mjs` after building and open `http://127.0.0.1:8767`. The page checks real computed styles before, during and after each stroke, including static playback alongside animated playback. Waiting strokes must be hidden so round dash caps cannot appear as stray dots. With the operating system's reduced-motion preference enabled, it checks that every stroke is visible without animation.

The default suite uses synthetic model tensors and the generated fixture. To also test a separately acquired model without committing it:

```sh
HANDWRITING_TEST_MODEL=/absolute/path/to/model.bin pnpm --filter @chankay/handwriting test:run
```

The inference adapter is independently implemented against the evaluated Calligrapher tensor format. Serialization names and alphabet IDs describe compatibility; they do not grant rights to model weights, training data, or third-party assets.
