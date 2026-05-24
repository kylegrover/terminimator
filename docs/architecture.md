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
- a small template library that forces the primitive system to prove itself

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

The current playground starts with a small fixed primitive set and a code-first editor. That is deliberate.

Before introducing a freer authoring surface or a node graph, the project needs to prove the scene model, the preview contract, and the exporter shape.

### JavaScript with rails

User-authored code should be JavaScript, but not freeform terminal scripting. The author writes a strict frame-script that calls a small set of row-building helpers such as `print(...)`, `bar(...)`, `repeat(...)`, `spinner(...)`, `marquee(...)`, `combine(...)`, and `counter()`.

That keeps the authoring experience flexible while preserving a shared intermediate representation for preview and export.

At the moment, the editor is effectively a small JS-authored DSL built from helper functions.

### Shared frame IR

Preview, templates, exporters, saved configs, and the later node graph should all target the same frame IR.

That IR is the real product core.

## Proposed execution model

### Author contract

The browser editor should ask the user to write source shaped roughly like this:

```ts
print(
  'loading' +
    repeat('.', { count: 3, from: 'frame' }) +
    '  ' +
    bar({ width: 24, filled: '=', empty: '.', showCounter: false }) +
    ' ' +
    counter(),
)

print('phase: compiling assets')
```

The script surface should expose deterministic runtime values and helpers such as:

- `frame`
- `step`
- `steps`
- `counter()`
- `bar(...)`
- `repeat(...)`
- `spinner(...)`
- `marquee(...)`
- `combine(...)`
- `pad(...)`
- `gate(...)`
- `print(...)`

Those helpers should still compile to pure structured nodes, not terminal side effects.

The older `return defineEffect({ ... })` object form can remain supported as a compatibility path for shared URLs, but it is no longer the primary authoring mode.

Potential early primitives:

- `print`
- `repeat`
- `bar`
- `spinner`
- `marquee`
- `combine`
- `pad`
- `gate`
- `counter`

These are the first primitives already represented in the repo and available in the editor helper surface.

Likely next primitives once the first slice settles:

- `style`
- `trim`
- `jitter`
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

- text editor first
- browser preview renderer first
- playback controls for frame, current, total, fps, and loop
- template switching to stress the IR with multiple effect shapes

The preview must feel deterministic. If the same inputs are replayed, the same frames should render.

For the current slice, a browser-native preview renderer is sufficient. A full terminal emulator can land later once ANSI behavior and cursor control matter.

The current evaluator uses strict helper-scoped JavaScript via the browser runtime. If sandbox guarantees become necessary, that can move behind QuickJS later without changing the IR.

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
  lib/runtime/
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

### Runtime trust boundary

The current code-first editor is intentionally strict, but it still rides the browser runtime. A future sandbox step is likely once the helper surface stabilizes.

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
3. Use the template library and the unsupported-ideas list to drive the next primitive additions.
4. Improve export quality for JS, Python, and Rust.
5. Add a better terminal preview surface and richer URL-sharing ergonomics.
5. Add Go once the current exporter contract holds up.
6. Start the graph editor only after the primitive vocabulary stabilizes.

## Questions to resolve before phase 1 is locked

- When should the playground switch from a form-first editor to code-first authoring?
- Which primitives belong in the next expansion beyond `text`, `repeat`, and `progressBar`?
- How far can URL-state sharing stretch before a downloadable preset format becomes necessary?

The first of those is now answered: code-first authoring is the current direction.