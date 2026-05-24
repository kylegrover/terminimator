# Frame Script Guide

This is the user-facing surface of Terminimator right now.

The mental model is simple: write the lines you want to see in the current frame. Each `print(...)` call becomes one terminal row. The moving parts come from a small set of helpers and live values.

## Core surface

### `print(...parts)`

Adds one terminal row.

`parts` can be plain strings, template literals, numbers, `repeat(...)`, `bar(...)`, `spinner(...)`, `marquee(...)`, `combine(...)`, `counter()`, and the live values `frame`, `step`, and `steps`.

```js
print('indexing project files')
print(`progress ${step}/${steps}`)
```

## Helpers

### `bar(options?)`

Builds a progress bar from the current playback values.

Options:

- `width`: bar width in characters. Default `24`.
- `filled`: character used for completed slots. Default `'='`.
- `empty`: character used for remaining slots. Default `'.'`.
- `showCounter`: append `current/total` automatically. Default `true`.

```js
print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))
```

### `spinner(...frames)`

Swaps between explicit frame strings using the current playback frame.

```js
print(spinner('|', '/', '-', '\\') + ' syncing package graph')
```

### `marquee(value, options?)`

Scrolls a longer string through a fixed-width window.

Options:

- `width`: visible window width. Default `24`.
- `gap`: spacing inserted before the text wraps back around. Default `'   '`.

```js
print(marquee('deploying edge regions across six zones', { width: 28, gap: '   ' }))
```

### `combine(value, options?)`

Adds deterministic combining marks after each non-space character.

Options:

- `marks`: combining characters to cycle through. Default `['\u0307', '\u0323', '\u0334']`.
- `depth`: how many marks to add after each character. Default `1`.
- `from`: `'frame'` or `'fixed'`. Use `'frame'` when the mark pattern should animate. Default `'frame'`.

```js
print(combine('signal degraded', { depth: 2, marks: ['\u0307', '\u0323', '\u0334'] }))
```

### `repeat(value, options?)`

Repeats a string fragment.

Options:

- `count`: maximum repeat count. Default `3`.
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

### `step`

Current playback progress value.

### `steps`

Total playback progress value.

These can be used directly inside template literals or string building.

```js
print(`frame ${frame}`)
print(`progress ${step}/${steps}`)
```

## Working style

- Keep the script row-oriented. One `print(...)` per visible line.
- Use plain strings first, then add helpers where motion or progress matters.
- Prefer combining a few simple helpers over introducing a new abstraction too early.

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

Two-line status:

```js
print('indexing project files')
print(`progress ${bar({ width: 20, showCounter: false })} ${step}/${steps}`)
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

- `pad` / `align`: fixed-width columns and cleaner multi-panel terminal layouts.
- `style`: ANSI color and emphasis spans once motion feels stable.
- `gate`: conditional fragments or whole lines that appear only at certain progress thresholds.