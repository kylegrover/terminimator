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
- export to Python, Node, Rust, and a deliberately scoped Bash subset

Do not start with:

- a backend
- collaborative sharing
- a node graph
- arbitrary-JS-to-every-language transpilation
- a package monorepo

## Technical posture

### Single app first

Use one Vite + React + TypeScript application until the project has a second deployable or a reusable package that truly deserves separation.

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
- `space`
- `line`
- `stack`
- `progressBar`
- `counter`
- `pad`
- `truncate`
- `overlay`
- `style`
- effect-specific helpers such as `wave` or `zalgoWave` once the IR can represent them cleanly

### Shared scene shape

Keep the IR multi-line capable even if the first templates are mostly one line.

That avoids repainting the whole model later when multiline effects or stacked status regions appear.

One possible starting shape:

```ts
type FrameScene = {
  lines: FrameNode[][]
  fps?: number
  done?: boolean
  meta?: Record<string, string | number | boolean>
}
```

### Preview runtime

- Monaco for authoring
- xterm.js for terminal rendering
- QuickJS in a worker for sandboxed execution
- mock controls for time, progress, step, total, and seed
- playback model that supports play, pause, reset, and scrub

The preview must feel deterministic. If the same inputs are replayed, the same frames should render.

## Export strategy

### Do not export arbitrary JavaScript

The exporter layer should compile the shared IR or effect definition into target-language templates.

That is the only realistic way to keep parity across Python, Node, Rust, and Bash without turning the project into a full compiler effort.

### Export order

1. Node
2. Python
3. Rust
4. Bash subset

Bash should be explicit about its ceiling. Math-heavy or Unicode-heavy effects may be unsupported or downgraded.

### Wrapper responsibility

Each exporter should own:

- redraw loop boilerplate
- cleanup behavior
- timing strategy
- progress updates and API surface
- effect configuration payload

Later, when exporters land, add golden fixtures for generated output so regressions are easy to detect.

## Libraries to adopt instead of custom infrastructure

- `Monaco Editor` for the browser editor
- `xterm.js` for terminal emulation and ANSI behavior
- `quickjs-emscripten` for sandboxed browser execution
- `Zod` for config and preset validation
- a proven width utility before exporter work begins; never rely on raw string length for display width

## Repo evolution plan

### Current repo

```text
src/
  app/
  styles/
```

### Next slices to add when implementation starts

```text
src/
  features/
    playground/
    templates/
    export/
  lib/
    schema/
    runtime/
    preview/
    exporters/
    utils/
```

The rule is to add slices only when they get real code. Do not create empty structure for imagined future abstractions.

## Known risks

### Cross-language parity

If the authoring surface becomes too freeform, the exporter promise breaks.

### Unicode width

Combining marks, wide glyphs, and terminal-specific rendering will create visual bugs if width math is naive.

### Bash portability

Bash timers, redraw loops, and math are limited. This needs a product-level support boundary.

### Sandbox overhead

QuickJS and worker messaging add runtime cost. The preview loop needs testing at realistic frame rates.

## Static-friendly sharing plan

Before any backend exists, prefer:

- local storage for draft persistence
- downloadable JSON for presets
- shareable URL encoding only if the effect schema stays compact enough

That keeps the product deployable as static files while still making effects portable.

## Suggested implementation sequence

1. Build the planning shell and docs.
2. Add the playground slice with editor, preview, and deterministic playback controls.
3. Lock the frame IR and helper API against a small set of curated templates.
4. Add export adapters using the shared IR, starting with Node and Python.
5. Add preset serialization and lightweight sharing.
6. Start the graph editor only after the primitive vocabulary stabilizes.

## Questions to resolve before phase 1 is locked

- Is the first stable frame model single-line-first or fully multi-line from day one?
- Which primitives are part of the first supported helper set?
- How much Bash support is officially promised?
- What is the first persistence format for user-created effects?