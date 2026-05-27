# Repo Guide

This document is the internal onboarding guide for collaborators working on Terminimator itself.

## What To Read First

1. `README.md` for scope and current product shape.
2. `docs/frame-script.md` for the current helper library and author-facing surface.
3. `docs/architecture.md` for design intent and tradeoffs.
4. This file for where code lives and how changes usually flow.

## Local Runbook

Install and run:

```bash
npm install
npm run dev
```

Normal validation commands:

```bash
npm run lint
npm run build
```

There is no dedicated automated browser suite yet. Manual browser checks are part of the normal workflow.

## Core Product Loop

The app is a single React page that turns frame-script source into a shared terminal effect model.

The main runtime path is:

1. User edits source in `PlaygroundPage.tsx`.
2. `compileEffectSource(...)` in `src/lib/runtime/effectDsl.ts` compiles that source into `EffectDefinition`.
3. `renderScene(...)` in `src/lib/preview/renderScene.ts` renders the same effect into the browser preview.
4. `generateCode(...)` in `src/lib/exporters/generateCode.ts` emits JS, Python, or Rust code from that effect.
5. `templates.ts` provides both starter content and the first real test corpus for the helper surface.

The shared IR is the center of the system. The preview and exporters should stay behaviorally aligned with it.

## Repo Map

### `src/app/App.tsx`

Tiny app shell. It just mounts the playground page.

### `src/features/playground/PlaygroundPage.tsx`

Owns the main user-facing state and flow:

- source text
- selected starter template id
- playback UI state
- export target
- URL share-state sync
- preview / export rendering selection

This is also where autoplay behavior, local-vs-shareable state, and copy-link behavior currently live.

### `src/features/playground/templates.ts`

Starter template library and current backlog ideas.

If you add a helper or primitive, add at least one template that makes the behavior obvious.

### `src/lib/schema/frame.ts`

Shared IR types.

If preview and exporters should agree on a new behavior, it usually starts here.

### `src/lib/runtime/effectDsl.ts`

The compiler and the author-facing helper surface.

This file currently owns:

- helper exposure to user source
- inline token handling for string composition
- node normalization and validation
- helper reference metadata shown in the UI
- compatibility support for older object-form source

### `src/lib/preview/renderScene.ts`

Browser preview semantics.

If a helper behaves differently in preview than in export, this file is one side of that bug.

### `src/lib/exporters/generateCode.ts`

Standalone code exporters for JS, Python, and Rust.

Each exporter should reflect the same IR semantics as the browser preview, even if the generated code style is still evolving.

### `src/lib/utils/urlState.ts`

Base64-like URL-safe encode/decode helpers.

The calling code decides what is shareable. This utility is intentionally dumb.

### `src/styles/index.css`

Global styling for the current single-page app.

### `docs/frame-script.md`

Author-facing helper library documentation.

### `docs/architecture.md`

Design rationale, current constraints, and higher-level tradeoffs.

## Share State Rules

Not all UI state belongs in the URL.

Current durable share state:

- source
- selected starter template id
- export target
- playback `total`
- playback `fps`
- playback `loop`

Current local-only UI state:

- current `frame`
- current `current` progress position
- play / pause state
- copy-to-clipboard status

This split exists so autoplay can run without rewriting the URL every frame.

## How To Add A Helper Or Primitive

Most new helpers follow the same path.

1. Add or extend shared types in `src/lib/schema/frame.ts`.
2. Expose the helper in `src/lib/runtime/effectDsl.ts`.
3. Normalize and validate the new node shape in the same runtime file.
4. Implement preview behavior in `src/lib/preview/renderScene.ts`.
5. Implement exporter behavior in `src/lib/exporters/generateCode.ts`.
6. Add at least one starter template in `src/features/playground/templates.ts`.
7. Update `docs/frame-script.md` and any overview docs that mention the helper surface.
8. Validate with lint, build, and a browser smoke test.

When possible, prefer adding a helper as a macro over existing primitives before creating a brand-new IR node.

## Current Manual Smoke Test

After a meaningful helper change, verify at least this:

1. A starter template using the helper compiles in the browser.
2. The preview visibly matches the intended behavior.
3. The JS export contains the expected node type or helper logic.
4. URL state only changes for durable share fields.
5. `npm run lint` passes.
6. `npm run build` passes.

## Current Gaps And Risks

- No golden tests for exporter parity yet.
- No dedicated browser automation suite yet.
- Width math is still basic; combining marks and complex Unicode will stay tricky.
- ANSI styling is not part of the shared IR yet.
- The helper surface is still exploratory, so docs need to stay close to code.

## Good First Contribution Areas

- Improve the clarity or originality of starter templates.
- Tighten helper docs when the runtime surface changes.
- Improve exporter readability without changing behavior.
- Add helpers that clearly generalize from existing templates.
- Improve browser smoke coverage once the helper surface settles.