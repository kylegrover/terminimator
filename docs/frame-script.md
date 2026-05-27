# Frame Script And Helper Library

This document is the user-facing reference for the current Terminimator helper library.

The mental model is simple: write the lines you want to see in the current frame. Each `print(...)` call becomes one terminal row. The moving parts come from a small set of helpers and live values.

## What Persists

The browser preview has both local UI state and shareable state.

Shareable URL state includes:

- source text
- selected starter template id
- export target
- playback `total`
- playback `fps`
- playback `loop`

UI-local state stays out of the URL:

- current `frame`
- current `current` progress position
- play / pause state

That is why the URL does not churn while autoplay is running.

## Core surface

### `print(...parts)`

Adds one terminal row.

`parts` can be plain strings, template literals, numbers, nested helper output, and the live values `frame`, `current`, `total`, `step`, and `steps`.

`print(...)` is the only helper that creates a new terminal row. Everything else returns an inline fragment.

```js
print('indexing project files')
print(`progress ${step}/${steps}`)
```

## Helpers

General composition rules:

- `bar(...)`, `repeat(...)`, `spinner(...)`, `marquee(...)`, `combine(...)`, `pad(...)`, `gate(...)`, and `counter()` return inline fragments.
- Those fragments can be concatenated with normal strings using `+` or template literals.
- `step` and `steps` are aliases for `current` and `total`.
- `bar(...)` is the preferred user-facing name; `progressBar(...)` still exists internally as a compatibility alias.
- `line(...)`, `text(...)`, and `return defineEffect({ ... })` still exist for compatibility, but they are not the main user-facing path.

### `bar(options?)`

Builds a progress bar from the current playback values.

Options:

- `width`: bar width in characters. Default `24`. Clamped to `4..48`.
- `filled`: character used for completed slots. Default `'='`.
- `empty`: character used for remaining slots. Default `'.'`.
- `showCounter`: append `current/total` automatically. Default `true`.

```js
print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))
```

### `pad(value, width, options?)`

Pads a fragment out to a fixed width.

Options:

- `align`: `'left'`, `'right'`, or `'center'`. Default `'left'`.
- `fill`: character used for the padding. Default `' '`.

Constraints:

- `width` is clamped to `1..80`.
- `fill` uses the first visible character only.

```js
print(pad('queue depth', 20, { fill: '.' }) + counter())
print(pad(step + '/' + steps, 12, { align: 'right' }))
```

### `gate(condition, ...parts)`

Shows a fragment only when the current playback value passes the condition.

Condition fields:

- `from`: `'current'`, `'frame'`, or `'total'`. Default `'current'`.
- `gt`, `gte`, `lt`, `lte`, `eq`: numeric checks applied to the chosen source.

If the condition does not pass, `gate(...)` returns an empty string.

```js
print('phase: ' + gate({ from: 'current', lt: 3 }, 'validating manifests'))
print('phase: ' + gate({ from: 'current', gte: 6 }, 'verifying cache propagation'))
```

### `spinner(...frames)`

Swaps between explicit frame strings using the current playback frame.

Constraints:

- Up to 24 frames are kept.
- Empty input falls back to `['|', '/', '-', '\\']`.

```js
print(spinner('|', '/', '-', '\\') + ' syncing package graph')
```

### `marquee(value, options?)`

Scrolls a longer string through a fixed-width window.

Options:

- `width`: visible window width. Default `24`. Clamped to `4..80`.
- `gap`: spacing inserted before the text wraps back around. Default `'   '`.

```js
print(marquee('deploying edge regions across six zones', { width: 28, gap: '   ' }))
```

### `combine(value, options?)`

Adds deterministic combining marks after each non-space character.

Options:

- `marks`: combining characters to cycle through. Default `['\u0307', '\u0323', '\u0334']`. Up to 8 marks are kept.
- `depth`: how many marks to add after each character. Default `1`. Clamped to `1..4`.
- `from`: `'frame'` or `'fixed'`. Use `'frame'` when the mark pattern should animate. Default `'frame'`.

```js
print(combine('signal degraded', { depth: 2, marks: ['\u0307', '\u0323', '\u0334'] }))
```

### `repeat(value, options?)`

Repeats a string fragment.

Options:

- `count`: maximum repeat count. Default `3`. Clamped to `0..16`.
- `from`: `'fixed'` or `'frame'`. Use `'frame'` when the count should animate as the frame changes.

```js
print('thinking' + repeat('.', { count: 3, from: 'frame' }))
```

### `counter(separator?)`

Returns the current step and total step count as a string.

```js
print('build ' + counter())
print('build ' + counter(' of '))
```

## Live values

### `frame`

Current playback frame.

### `current`

Current playback progress value.

### `total`

Current playback total value.

### `step`

Alias for `current`.

### `steps`

Alias for `total`.

These can be used directly inside template literals or string building.

```js
print(`frame ${frame}`)
print(`raw progress ${current}/${total}`)
print(`progress ${step}/${steps}`)
```

## Current Starter Templates

The dropdown in the editor is also the best current example library.

- `Compile Progress`: repeat + bar + counter across two lines.
- `Frame Spinner Set`: explicit frame-by-frame spinner.
- `Padded Ledger`: fixed-width columns from `pad(...)`.
- `Quiet Dots`: tiny frame-based repeat animation.
- `Download Meter`: single-line louder progress bar.
- `Marquee Logline`: scrolling clipped text window.
- `Two-Line Status`: simple multiline progress layout.
- `Phase Gates`: threshold-driven conditional copy.
- `Void Hum`: deterministic combining-mark distortion.

## Working style

- Keep the script row-oriented. One `print(...)` per visible line.
- Use plain strings first, then add helpers where motion or progress matters.
- Prefer combining a few simple helpers over introducing a new abstraction too early.
- Treat the starter templates as executable reference docs, not just demos.
- When a helper needs nested behavior, prefer composing existing helpers before adding a new primitive.

## Examples

Minimal dots:

```js
print('thinking' + repeat('.', { count: 3, from: 'frame' }))
```

Frame spinner:

```js
print(spinner('|', '/', '-', '\\') + ' syncing package graph')
print('step ' + counter())
```

Padded ledger:

```js
print(pad('queue depth', 20, { fill: '.' }) + counter())
print(pad('region us-east-1', 20) + pad(step + '/' + steps, 12, { align: 'right' }))
```

Two-line status:

```js
print('indexing project files')
print(`progress ${bar({ width: 20, showCounter: false })} ${step}/${steps}`)
```

Phase gates:

```js
print('deploy ' + bar({ width: 18, showCounter: false }) + ' ' + counter())
print('phase: ' + gate({ from: 'current', lt: 3 }, 'validating manifests') + gate({ from: 'current', gte: 3, lt: 6 }, 'uploading bundles') + gate({ from: 'current', gte: 6 }, 'verifying cache propagation'))
```

Marquee logline:

```js
print(marquee('deploying edge regions across six zones', { width: 28, gap: '   ' }))
print('rollout ' + counter())
```

Louder download meter:

```js
print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))
```

Void hum:

```js
print(combine('signal degraded', { depth: 2, marks: ['\u0307', '\u0323', '\u0334'] }))
print('carrier ' + repeat('~', { count: 6, from: 'frame' }))
```

## Ideas After This Batch

These are good candidates to consider once you have time to test the current helper set.

- `style`: ANSI color and emphasis spans once motion feels stable.
- `trim`: width-aware clipping and ellipsis helpers.
- `jitter`: deterministic pseudo-random motion and text instability.

## Internal Notes For Collaborators

If you are changing the helper library itself, also read `docs/repo-guide.md`.

In practice, a new helper usually means touching:

1. `src/lib/schema/frame.ts`
2. `src/lib/runtime/effectDsl.ts`
3. `src/lib/preview/renderScene.ts`
4. `src/lib/exporters/generateCode.ts`
5. `src/features/playground/templates.ts`
6. this file and any high-level overview docs