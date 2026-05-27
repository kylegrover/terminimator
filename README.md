# Terminimator

Terminimator is a static single-page playground for designing terminal-first motion: loaders, spinners, progress bars, text transitions, and stranger CLI effects that still feel native to a terminal.

The product direction is "Terminal Shadertoy": immediate feedback, a strong authoring surface, and exportable code for real scripts.

## Start Here

If you are new to the repo, read these in order:

1. `README.md` for product scope, current capabilities, and quick start.
2. `docs/frame-script.md` for the author-facing helper library and example surface.
3. `docs/repo-guide.md` for the internal repo map, state flow, and contributor workflow.
4. `docs/architecture.md` for the higher-level design rationale and tradeoffs.

## Current posture

- One Vite + React + TypeScript app.
- No backend.
- No monorepo.
- No separate DSL on day one.
- No node graph until the underlying frame primitives are proven.
- First export targets are JS, Python, and Rust.
- Authoring is now code-first instead of form-first.
- The current authoring surface is strict JS in a frame-script style: `print(...)` builds rows while helpers like `bar(...)`, `repeat(...)`, `spinner(...)`, `marquee(...)`, `combine(...)`, `pad(...)`, and `gate(...)` fill in dynamic pieces.
- The preview auto-plays by default and loops unless the user turns loop off.
- Sharing is URL-encoded state.
- Persistence is the generated standalone code.

## Quick start

```bash
npm install
npm run dev
```

Useful follow-up commands:

```bash
npm run lint
npm run build
npm run preview
```

There is no automated browser test suite yet. The current workflow is lint, build, then a manual browser smoke check.

## What the app does today

- Lets the user write a frame-script in a textarea.
- Compiles that script into a shared multiline terminal IR.
- Renders the same IR in the browser preview and the code exporters.
- Exports standalone JS, Python, and Rust versions of the current effect.
- Provides a starter template library that doubles as the main primitive test harness.
- Shares durable state through the URL.

Only durable state is encoded into the URL:

- source
- selected starter template id
- export target
- playback `total`
- playback `fps`
- playback `loop`

Transient UI-only state stays local:

- current frame
- current progress position
- play/pause state
- clipboard status

## Current repo shape

```text
terminimator/
  docs/
    architecture.md
    frame-script.md
    repo-guide.md
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
- `spinner`
- `marquee`
- `combine`
- `pad`
- `gate`
- `counter`
- `frame` / `current` / `total`
- `step` / `steps`

The primary helper guide is in `docs/frame-script.md`.

That is enough to validate the frame-script workflow, shared IR, preview loop, and export strategy before widening the primitive surface.

## Current starter library

The built-in starter templates are the main coverage surface for the current helpers:

- `Compile Progress`: repeat + bar + counter across two lines.
- `Frame Spinner Set`: explicit spinner frames.
- `Padded Ledger`: fixed-width layout with `pad(...)`.
- `Quiet Dots`: smallest viable single-line loader.
- `Download Meter`: louder bar style and counter display.
- `Marquee Logline`: scrolling clipped status text.
- `Two-Line Status`: stacked multiline output.
- `Phase Gates`: threshold-based conditional copy.
- `Void Hum`: deterministic combining-mark text effects.

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

## Near-term milestones

1. Tighten the frame-script helper surface and keep the IR honest as templates expand.
2. Improve the template library and let unsupported ideas drive the next primitive additions.
3. Improve the generated JS, Python, and Rust output until it is clean enough to drop into real scripts.
4. Add richer shareable URL state handling and better editor ergonomics.
5. Add Go after the first exporter trio feels stable.

See `docs/architecture.md` for the full technical plan.
See `docs/frame-script.md` for the user-facing helper guide.
See `docs/repo-guide.md` for the internal contributor guide.

