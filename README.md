# Terminimator

Terminimator is a static single-page playground for designing terminal-first motion: loaders, spinners, progress bars, text transitions, and stranger CLI effects that still feel native to a terminal.

The product direction is "Terminal Shadertoy": immediate feedback, a strong authoring surface, and exportable code for real scripts.

## Current posture

- One Vite + React + TypeScript app.
- No backend.
- No monorepo.
- No separate DSL on day one.
- No node graph until the underlying frame primitives are proven.
- First export targets are JS, Python, and Rust.
- Authoring is now code-first instead of form-first.
- The current authoring surface is strict JS in a frame-script style: `title(...)`, `describe(...)`, and `print(...)` build the terminal IR.
- Sharing is URL-encoded state.
- Persistence is the generated standalone code.

## Current repo shape

```text
terminimator/
  docs/
    architecture.md
  src/
    app/
      App.tsx
    features/
      playground/
    lib/
      exporters/
      preview/
      runtime/
      schema/
      utils/
    styles/
      index.css
  index.html
  package.json
  vite.config.ts
```

## Implemented first slice

```text
src/
  features/
    playground/    # frame-script editor, playback controls, share link, export panel
  lib/
    schema/        # multiline-capable scene types
    preview/       # frame rendering for the browser preview
    exporters/     # JS, Python, Rust standalone output
    utils/         # URL-safe state encoding
```

Current user-facing helpers are intentionally tiny:

- `print`
- `repeat`
- `bar`
- `counter`
- `frame` / `step` / `steps`

That is enough to validate the frame-script workflow, shared IR, preview loop, and export strategy before widening the primitive surface.

## Guiding decisions

- Keep the app deployable as static files from day one.
- Keep the scene model multiline-capable even if many early effects fit on one line.
- Make preview, exporters, and the later node graph all target the same shared frame IR.
- Keep the current JS authoring surface strict enough that frame-script source compiles directly to the shared IR.
- Let output code be the persistence format; use URL-encoded state for lightweight sharing.
- Lean on established libraries when they clearly reduce code, but avoid dependency weight before it earns its place.

## Near-term direction

- Keep building out the current playground instead of jumping to the graph editor.
- Keep refining the code editor, helper surface, and template library before any visual graph work.
- Add a real terminal emulator once ANSI behavior and cursor motion matter more than plain preview fidelity.
- Expand exporters from JS/Python/Rust to Go next if it fits the model cleanly.
- Leave Bash out of the first slice.

Potential later libraries still on the shortlist:

- `Monaco Editor`
- `xterm.js`
- `quickjs-emscripten`
- `Zod`

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Near-term milestones

1. Tighten the frame-script helper surface and keep the IR honest as templates expand.
2. Improve the template library and let unsupported ideas drive the next primitive additions.
3. Improve the generated JS, Python, and Rust output until it is clean enough to drop into real scripts.
4. Add richer shareable URL state handling and better editor ergonomics.
5. Add Go after the first exporter trio feels stable.

See `docs/architecture.md` for the full technical plan.
