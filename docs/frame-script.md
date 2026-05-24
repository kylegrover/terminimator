# Frame Script Guide

This is the user-facing surface of Terminimator right now.

The mental model is simple: write the lines you want to see in the current frame. Each `print(...)` call becomes one terminal row. The moving parts come from a small set of helpers and live values.

## Core surface

### `print(...parts)`

Adds one terminal row.

`parts` can be plain strings, template literals, numbers, `repeat(...)`, `bar(...)`, `counter()`, and the live values `frame`, `step`, and `steps`.

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

Two-line status:

```js
print('indexing project files')
print(`progress ${bar({ width: 20, showCounter: false })} ${step}/${steps}`)
```

Louder download meter:

```js
print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))
```