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

User-authored code should be JavaScript, but not freeform terminal scripting. The author writes a strict frame-script that calls a small set of row-building helpers such as `print(...)`, `bar(...)`, `repeat(...)`, `spinner(...)`, `marquee(...)`, `combine(...)`, `pad(...)`, `gate(...)`, and `counter()`.

That keeps the authoring experience flexible while preserving a shared intermediate representation for preview and export.

At the moment, the editor is effectively a small JS-authored DSL built from helper functions.

The preferred user-facing surface is the frame-script helper library documented in `docs/frame-script.md`.

The runtime still exposes some lower-level compatibility helpers such as `text(...)`, `line(...)`, `progressBar(...)`, and `return defineEffect({ ... })`, but those are not the primary authoring path.

### Shared frame IR

Preview, templates, exporters, saved configs, and the later node graph should all target the same frame IR.

That IR is the real product core.

The current shape is closer to this than the earlier scene-object sketches:

```ts
type EffectDefinition = {
  name: string
  description?: string
  lines: FrameNode[][]
}
```

Each `FrameNode` is one primitive in a rendered line. The preview and exporters are intentionally driven from the same node list.

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
- `current`
- `total`
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

### Preview runtime

- text editor first
- browser preview renderer first
- playback controls for frame, current, total, fps, and loop
- template switching to stress the IR with multiple effect shapes
- autoplay enabled by default so edits immediately play through the loop

The preview must feel deterministic. If the same inputs are replayed, the same frames should render.

For the current slice, a browser-native preview renderer is sufficient. A full terminal emulator can land later once ANSI behavior and cursor control matter.

The current evaluator uses strict helper-scoped JavaScript via the browser runtime. If sandbox guarantees become necessary, that can move behind QuickJS later without changing the IR.

### Share state boundary

The URL is intentionally not a full replay of the UI.

Durable share state currently includes:

- source text
- selected starter template id
- export target
- playback `total`
- playback `fps`
- playback `loop`

Transient UI state is intentionally excluded:

- current `frame`
- current `current` progress value
- play / pause state

That keeps the URL stable while autoplay is running.

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

The current control path is:

1. `PlaygroundPage.tsx` owns source text, playback UI state, share-state sync, and export target selection.
2. `effectDsl.ts` compiles frame-script source into `EffectDefinition`.
3. `renderScene.ts` renders that effect into browser preview text.
4. `generateCode.ts` emits JS, Python, or Rust code from the same effect.
5. `templates.ts` stress-tests the helper surface and acts as the first library of examples.

The rule is to add slices only when they get real code. Do not create empty structure for imagined future abstractions.

### Primitive addition workflow

Any new helper or primitive should usually touch the same set of places:

1. `src/lib/schema/frame.ts` for node shape or shared types.
2. `src/lib/runtime/effectDsl.ts` for helper exposure, normalization, and docs metadata.
3. `src/lib/preview/renderScene.ts` for preview semantics.
4. `src/lib/exporters/generateCode.ts` for JS, Python, and Rust parity.
5. `src/features/playground/templates.ts` for at least one starter example.
6. `docs/frame-script.md` and any relevant overview docs.
7. Validation through `npm run lint`, `npm run build`, and a manual browser smoke test.

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
3. Use the template library and the current idea backlog to drive the next primitive additions.
4. Improve export quality for JS, Python, and Rust.
5. Add a better terminal preview surface and richer URL-sharing ergonomics.
6. Add Go once the current exporter contract holds up.
7. Start the graph editor only after the primitive vocabulary stabilizes.

## Current open questions

- When should ANSI styling become part of the shared IR instead of staying a later formatting layer?
- How far can URL-state sharing stretch before downloadable preset files become necessary?
- When do width-aware trimming and jitter become important enough to promote into the default helper surface?