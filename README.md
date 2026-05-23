# Terminimator

Terminimator starts as a static single-page web app for designing terminal-first motion: loaders, spinners, progress bars, text transitions, and stranger one-line effects that still feel at home in a CLI.

The product direction is "Terminal Shadertoy": immediate feedback, a strong authoring surface, and exportable code for real scripts.

## Current posture

- One Vite + React + TypeScript app.
- No backend.
- No monorepo.
- No separate DSL on day one.
- No node graph until the underlying frame primitives are proven.

## Current repo shape

```text
terminimator/
  docs/
    architecture.md
  src/
    app/
      App.tsx
      blueprint.ts
    styles/
      index.css
  index.html
  package.json
  vite.config.ts
```

## Planned slices to add when code lands

```text
src/
  features/
    playground/    # editor, preview, playback, mock injectors
    templates/     # starter effects, presets, gallery metadata
    export/        # target selection, generated code, download flows
  lib/
    schema/        # frame IR, validation, shared types
    runtime/       # worker sandbox, host APIs, execution loop
    preview/       # xterm integration, time/progress playback
    exporters/     # Python, Node, Rust, Bash emitters
    utils/         # width helpers, formatting, small shared helpers
```

The rule is simple: do not create a slice until it owns real code.

## Guiding decisions

- Keep the app deployable as static files from day one.
- Let users author effects in JavaScript with rails, not arbitrary terminal side effects.
- Make preview, templates, exporters, and the later node graph all target the same shared frame IR.
- Lean on established libraries instead of building editor, terminal, or sandbox infrastructure from scratch.

## Library shortlist

- `Monaco Editor` for the in-browser code editor.
- `xterm.js` for ANSI-accurate terminal preview.
- `quickjs-emscripten` for sandboxed user-authored JavaScript in the browser.
- `Zod` for validating saved effect configs and export inputs.

Those are architectural picks, not installed dependencies yet. The repo stays lean until the playground slice starts.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Near-term milestones

1. Build the phase-one playground shell: editor, terminal preview, playback controls, and starter templates.
2. Define the frame IR and host helper surface that user-authored JavaScript is allowed to return.
3. Add export adapters for Node, Python, Rust, and a clearly limited Bash subset.
4. Add shareable presets before considering any backend.
5. Use the learned primitives as the basis for a later node graph mode.

See `docs/architecture.md` for the full technical plan.
