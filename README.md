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
    playground/    # scene editor, playback controls, share link, export panel
  lib/
    schema/        # multiline-capable scene types
    preview/       # frame rendering for the browser preview
    exporters/     # JS, Python, Rust standalone output
    utils/         # URL-safe state encoding
```

Current primitives are intentionally tiny:

- `text`
- `repeat`
- `progressBar`

That is enough to validate the scene model, preview loop, and export strategy before widening the primitive surface.

## Guiding decisions

- Keep the app deployable as static files from day one.
- Keep the scene model multiline-capable even if many early effects fit on one line.
- Make preview, exporters, and the later node graph all target the same shared frame IR.
- Let output code be the persistence format; use URL-encoded state for lightweight sharing.
- Lean on established libraries when they clearly reduce code, but avoid dependency weight before it earns its place.

## Near-term direction

- Keep building out the current playground instead of jumping to the graph editor.
- Add a real terminal preview surface and code authoring surface once the primitive contract settles.
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

1. Refine the first-slice playground UI and tighten the primitive editing flow.
2. Lock the shared frame IR around the initial `text`, `repeat`, and `progressBar` primitives.
3. Improve the generated JS, Python, and Rust output until it is clean enough to drop into real scripts.
4. Add richer shareable URL state handling and a small template gallery.
5. Add Go after the first exporter trio feels stable.

See `docs/architecture.md` for the full technical plan.
