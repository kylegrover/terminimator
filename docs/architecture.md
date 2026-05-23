# Terminimator Architecture

## North star

Build a static single-page "Terminal Shadertoy" for composing CLI loaders, spinners, progress bars, and text transitions with immediate preview and exportable code.

The key product promise is not a canned spinner library. It is a fast visual system for inventing new terminal motion without needing to hand-roll redraw loops every time.

## First-product boundary

Focus first on:

- loaders and spinners
- progress bars and counters
- text transitions and overlays
- a live preview that feels trustworthy
- export to JS, Python, and Rust
- lightweight sharing through URL-encoded state

Do not start with:

- a backend
- collaborative sharing
- a node graph
- arbitrary-JS-to-every-language transpilation
- a package monorepo

## Technical posture

### Single app first

Use one Vite + React + TypeScript application until the project has a second deployable or a reusable package that truly deserves separation.

### Structured first slice

The current playground starts with a small fixed primitive set and a visual editor. That is deliberate.

Before introducing a freer authoring surface, the project needs to prove the scene model, the preview contract, and the exporter shape.

### JavaScript with rails

User-authored code should be JavaScript, but not freeform terminal scripting. The author writes a callback that returns structured frame data assembled from provided helper primitives.

That keeps the authoring experience flexible while preserving a shared intermediate representation for preview and export.

### Shared frame IR

Preview, templates, exporters, saved configs, and the later node graph should all target the same frame IR.

That IR is the real product core.

## Proposed execution model

### Author contract

The browser editor should ask the user to implement a function shaped roughly like this:

```ts
export function renderFrame(ctx, fx) {
  return fx.line([
    fx.text('loading'),
    fx.repeat('.', ctx.frame % 4),
    fx.progressBar({ current: ctx.step, total: ctx.total, width: 24 }),
  ])
}
```

`ctx` should expose deterministic runtime values such as:

- `time`
- `frame`
- `progress`
- `step`
- `total`
- `seed`
- user-defined variables that come from the current preset or controls

`fx` should expose pure helpers that return structured nodes, not terminal side effects.

Potential early primitives:

- `text`
- `repeat`
- `progressBar`

These are the first primitives already represented in the repo.

Likely next primitives once the first slice settles:

- `space`
- `counter`
- `pad`
- `truncate`
- `style`
- effect-specific helpers once the IR can represent them cleanly

### Shared scene shape

Keep the IR multi-line capable even if the first templates are mostly one line.

That avoids repainting the whole model later when multiline effects or stacked status regions appear.

The current repo uses a shape in this direction:

```ts
type FrameScene = {
  lines: {
    id: string
    nodes: FrameNode[]
  }[]
}
```

### Preview runtime

- Monaco for authoring
- xterm.js for terminal rendering
- QuickJS in a worker for sandboxed execution
- mock controls for time, progress, step, total, and seed
- playback model that supports play, pause, reset, and scrub

The preview must feel deterministic. If the same inputs are replayed, the same frames should render.

For the current slice, a browser-native preview renderer is sufficient. A full terminal emulator can land later once ANSI behavior and cursor control matter.

## Export strategy

### Do not export arbitrary JavaScript

The exporter layer should compile the shared IR or effect definition into target-language templates.

That is the only realistic way to keep parity across JS, Python, Rust, and later Go without turning the project into a full compiler effort.

### Export order

1. JS / Node
2. Python
3. Rust
4. Go

Bash is out of the first slice.

### Wrapper responsibility

Each exporter should own:

- redraw loop boilerplate
- cleanup behavior
- timing strategy
- progress updates and API surface
- effect configuration payload

In the current prototype, code export is also the primary persistence format.

Later, when exporters land, add golden fixtures for generated output so regressions are easy to detect.

## Libraries to adopt instead of custom infrastructure

- `Monaco Editor` for the browser editor
- `xterm.js` for terminal emulation and ANSI behavior
- `quickjs-emscripten` for sandboxed browser execution
- `Zod` for config and preset validation
- a proven width utility before exporter work begins; never rely on raw string length for display width

Those remain likely next dependencies, but the first slice does not need all of them yet.

## Repo evolution plan

### Current repo

```text
src/
  app/
  features/playground/
  lib/exporters/
  lib/preview/
  lib/schema/
  lib/utils/
  styles/
```

### Next slices to add when implementation starts

```text
src/
  features/
    templates/
    export/
  lib/
    runtime/
```

The rule is to add slices only when they get real code. Do not create empty structure for imagined future abstractions.

## Known risks

### Cross-language parity

If the authoring surface becomes too freeform, the exporter promise breaks.

### Unicode width

Combining marks, wide glyphs, and terminal-specific rendering will create visual bugs if width math is naive.

### Sandbox overhead

QuickJS and worker messaging add runtime cost. The preview loop needs testing at realistic frame rates.

## Static-friendly sharing plan

Before any backend exists, prefer:

- generated standalone code as the main persistence format
- shareable URL encoding for lightweight state handoff
- downloadable JSON only if URL-sized sharing stops being practical

That keeps the product deployable as static files while still making effects portable.

## Suggested implementation sequence

1. Tighten the current playground and its primitive editing UX.
2. Lock the frame IR around the current multiline-ready scene shape.
3. Improve export quality for JS, Python, and Rust.
4. Add a small template layer and better URL-sharing ergonomics.
5. Add Go once the current exporter contract holds up.
6. Start the graph editor only after the primitive vocabulary stabilizes.

## Questions to resolve before phase 1 is locked

- When should the playground switch from a form-first editor to code-first authoring?
- Which primitives belong in the next expansion beyond `text`, `repeat`, and `progressBar`?
- How far can URL-state sharing stretch before a downloadable preset format becomes necessary?