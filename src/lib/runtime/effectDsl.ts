import type {
  CombineMarksNode,
  EffectDefinition,
  FrameNode,
  MarqueeNode,
  PrimitiveType,
  ProgressBarNode,
  RepeatNode,
  RepeatSource,
  SpinnerNode,
  TextNode,
  ValueNode,
  ValueSource,
} from '../schema/frame'

type DslRepeatOptions = {
  count?: number
  from?: RepeatSource
}

type DslProgressBarOptions = {
  width?: number
  filled?: string
  empty?: string
  showCounter?: boolean
}

type DslMarqueeOptions = {
  width?: number
  gap?: string
}

type DslCombineOptions = {
  marks?: string[]
  depth?: number
  from?: RepeatSource
}

type DslEffectDefinition = {
  name?: unknown
  description?: unknown
  lines?: unknown
}

type InlineToken = {
  __terminimatorToken: string
  toString(): string
  valueOf(): string
  [Symbol.toPrimitive](): string
}

const INLINE_TOKEN_PREFIX = '__terminimator_inline_'
const INLINE_TOKEN_PATTERN = /__terminimator_inline_\d+__/g
const LEGACY_METADATA_LINE_PATTERN = /^\s*(title|describe)\(.*\)\s*;?\s*$/
const DEFAULT_SPINNER_FRAMES = ['|', '/', '-', '\\']
const DEFAULT_COMBINING_MARKS = ['\u0307', '\u0323', '\u0334']

export type CompileResult =
  | {
      ok: true
      effect: EffectDefinition
    }
  | {
      ok: false
      error: string
    }

export const dslReference = [
  {
    signature: "print('indexing project files')",
    detail: 'Each print(...) call becomes one terminal row in the preview and exports.',
  },
  {
    signature: "print(spinner('|', '/', '-', '\\\\') + ' syncing package graph')",
    detail: 'spinner(...) swaps between explicit frame strings based on the playback frame.',
  },
  {
    signature: "print(marquee('deploying edge regions', { width: 28, gap: '   ' }))",
    detail: 'marquee(...) scrolls a longer phrase through a fixed-width window.',
  },
  {
    signature: "print(combine('signal degraded', { depth: 2 }))",
    detail: 'combine(...) layers deterministic combining marks over each non-space character.',
  },
  {
    signature: "print('download ' + bar({ width: 30, filled: '#', empty: '-' }))",
    detail: 'bar(...) builds the visual meter and can be dropped straight into a printed line.',
  },
  {
    signature: "repeat('.', { count: 3, from: 'frame' })",
    detail: 'Use repeat(...) when the playback frame should animate part of a line.',
  },
  {
    signature: 'counter()',
    detail: 'Use counter() when you want current/total without manually building the string.',
  },
  {
    signature: '`progress ${step}/${steps}`',
    detail: 'frame, step, and steps are live values you can embed directly in template literals.',
  },
] as const

function clampInteger(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function sanitizeStringArray(rawValue: unknown, fallback: string[], maxLength: number) {
  if (!Array.isArray(rawValue)) {
    return [...fallback]
  }

  const values = rawValue
    .map((value) => String(value))
    .filter((value) => value.length > 0)
    .slice(0, maxLength)

  return values.length > 0 ? values : [...fallback]
}

function textNode(value: unknown): TextNode {
  return {
    type: 'text',
    value: String(value),
  }
}

function valueNode(source: ValueSource): ValueNode {
  return {
    type: 'value',
    source,
  }
}

function repeatNode(value: string, options: DslRepeatOptions = {}): RepeatNode {
  return {
    type: 'repeat',
    value: String(value),
    count: clampInteger(options.count ?? 3, 0, 16),
    from: options.from === 'frame' ? 'frame' : 'fixed',
  }
}

function progressBarNode(options: DslProgressBarOptions = {}): ProgressBarNode {
  return {
    type: 'progressBar',
    width: clampInteger(options.width ?? 24, 4, 48),
    filled: String(options.filled ?? '='),
    empty: String(options.empty ?? '.'),
    showCounter: options.showCounter ?? true,
  }
}

function spinnerNode(rawFrames: unknown): SpinnerNode {
  return {
    type: 'spinner',
    frames: sanitizeStringArray(rawFrames, DEFAULT_SPINNER_FRAMES, 24),
  }
}

function marqueeNode(value: unknown, options: DslMarqueeOptions = {}): MarqueeNode {
  return {
    type: 'marquee',
    value: String(value ?? ''),
    width: clampInteger(options.width ?? 24, 4, 80),
    gap: String(options.gap ?? '   '),
  }
}

function combineMarksNode(value: unknown, options: DslCombineOptions = {}): CombineMarksNode {
  return {
    type: 'combineMarks',
    value: String(value ?? ''),
    marks: sanitizeStringArray(options.marks, DEFAULT_COMBINING_MARKS, 8),
    depth: clampInteger(options.depth ?? 1, 1, 4),
    from: options.from === 'fixed' ? 'fixed' : 'frame',
  }
}

function defineEffect(effect: DslEffectDefinition) {
  return effect
}

function isFrameNode(value: unknown): value is FrameNode {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeNode = value as Record<string, unknown>

  return (
    maybeNode.type === 'text' ||
    maybeNode.type === 'value' ||
    maybeNode.type === 'repeat' ||
    maybeNode.type === 'progressBar' ||
    maybeNode.type === 'spinner' ||
    maybeNode.type === 'marquee' ||
    maybeNode.type === 'combineMarks'
  )
}

function createInlineToken(token: string): InlineToken {
  const stringify = () => token

  return {
    __terminimatorToken: token,
    toString: stringify,
    valueOf: stringify,
    [Symbol.toPrimitive]: stringify,
  }
}

function isInlineToken(value: unknown): value is InlineToken {
  return Boolean(
    value &&
      typeof value === 'object' &&
      '__terminimatorToken' in value &&
      typeof (value as InlineToken).__terminimatorToken === 'string',
  )
}

function createScriptBuilder() {
  const state: {
    lines: FrameNode[][]
  } = {
    lines: [],
  }

  const inlineTokens = new Map<string, FrameNode>()
  let tokenIndex = 0

  function tokenize(node: FrameNode) {
    const token = `${INLINE_TOKEN_PREFIX}${tokenIndex}__`
    tokenIndex += 1
    inlineTokens.set(token, node)
    return createInlineToken(token)
  }

  const frame = tokenize(valueNode('frame'))
  const current = tokenize(valueNode('current'))
  const total = tokenize(valueNode('total'))

  function expandString(value: string) {
    const nodes: FrameNode[] = []
    let lastIndex = 0

    for (const match of value.matchAll(INLINE_TOKEN_PATTERN)) {
      const token = match[0]
      const tokenIndex = match.index ?? 0

      if (tokenIndex > lastIndex) {
        nodes.push(textNode(value.slice(lastIndex, tokenIndex)))
      }

      const node = inlineTokens.get(token)
      if (node) {
        nodes.push(node)
      } else {
        nodes.push(textNode(token))
      }

      lastIndex = tokenIndex + token.length
    }

    if (lastIndex < value.length) {
      nodes.push(textNode(value.slice(lastIndex)))
    }

    if (nodes.length === 0) {
      return [textNode(value)]
    }

    return nodes
  }

  function expandPart(part: unknown): FrameNode[] {
    if (part == null || part === false) {
      return []
    }

    if (Array.isArray(part)) {
      return part.flatMap((value) => expandPart(value))
    }

    if (isInlineToken(part)) {
      const tokenNode = inlineTokens.get(part.__terminimatorToken)
      return tokenNode ? [tokenNode] : []
    }

    if (isFrameNode(part)) {
      return [part]
    }

    if (typeof part === 'string') {
      return expandString(part)
    }

    if (typeof part === 'number' || typeof part === 'boolean' || typeof part === 'bigint') {
      return [textNode(String(part))]
    }

    return expandString(String(part))
  }

  function createLine(...parts: unknown[]) {
    const nodes = parts.flatMap((part) => expandPart(part))
    return nodes.length > 0 ? nodes : [textNode('')]
  }

  return {
    print(...parts: unknown[]) {
      state.lines.push(createLine(...parts))
    },
    line(...parts: unknown[]) {
      return createLine(...parts)
    },
    text(value: unknown) {
      return textNode(value)
    },
    repeat(value: string, options: DslRepeatOptions = {}) {
      return tokenize(repeatNode(value, options))
    },
    progressBar(options: DslProgressBarOptions = {}) {
      return tokenize(progressBarNode(options))
    },
    bar(options: DslProgressBarOptions = {}) {
      return tokenize(progressBarNode(options))
    },
    spinner(...frames: unknown[]) {
      const rawFrames = frames.length === 1 && Array.isArray(frames[0]) ? frames[0] : frames
      return tokenize(spinnerNode(rawFrames))
    },
    marquee(value: unknown, options: DslMarqueeOptions = {}) {
      return tokenize(marqueeNode(value, options))
    },
    combine(value: unknown, options: DslCombineOptions = {}) {
      return tokenize(combineMarksNode(value, options))
    },
    counter(separator = '/') {
      return `${current}${separator}${total}`
    },
    frame,
    current,
    total,
    step: current,
    steps: total,
    hasStructuredOutput() {
      return state.lines.length > 0
    },
    toEffect() {
      if (state.lines.length === 0) {
        throw new Error(
          'Add at least one print(...) line, or return defineEffect({ ... }) if you need the legacy object form.',
        )
      }

      return normalizeEffect({
        lines: state.lines,
      })
    },
  }
}

function normalizeTextNode(rawNode: Record<string, unknown>): TextNode {
  return {
    type: 'text',
    value: String(rawNode.value ?? ''),
  }
}

function normalizeValueNode(rawNode: Record<string, unknown>): ValueNode {
  return {
    type: 'value',
    source:
      rawNode.source === 'frame' || rawNode.source === 'total' ? rawNode.source : 'current',
  }
}

function normalizeRepeatNode(rawNode: Record<string, unknown>): RepeatNode {
  return {
    type: 'repeat',
    value: String(rawNode.value ?? '.'),
    count: clampInteger(Number(rawNode.count ?? 3), 0, 16),
    from: rawNode.from === 'frame' ? 'frame' : 'fixed',
  }
}

function normalizeProgressBarNode(rawNode: Record<string, unknown>): ProgressBarNode {
  return {
    type: 'progressBar',
    width: clampInteger(Number(rawNode.width ?? 24), 4, 48),
    filled: String(rawNode.filled ?? '='),
    empty: String(rawNode.empty ?? '.'),
    showCounter: rawNode.showCounter !== false,
  }
}

function normalizeSpinnerNode(rawNode: Record<string, unknown>): SpinnerNode {
  return {
    type: 'spinner',
    frames: sanitizeStringArray(rawNode.frames, DEFAULT_SPINNER_FRAMES, 24),
  }
}

function normalizeMarqueeNode(rawNode: Record<string, unknown>): MarqueeNode {
  return {
    type: 'marquee',
    value: String(rawNode.value ?? ''),
    width: clampInteger(Number(rawNode.width ?? 24), 4, 80),
    gap: String(rawNode.gap ?? '   '),
  }
}

function normalizeCombineMarksNode(rawNode: Record<string, unknown>): CombineMarksNode {
  return {
    type: 'combineMarks',
    value: String(rawNode.value ?? ''),
    marks: sanitizeStringArray(rawNode.marks, DEFAULT_COMBINING_MARKS, 8),
    depth: clampInteger(Number(rawNode.depth ?? 1), 1, 4),
    from: rawNode.from === 'fixed' ? 'fixed' : 'frame',
  }
}

function normalizeNode(rawNode: unknown, lineIndex: number, nodeIndex: number): FrameNode {
  if (!rawNode || typeof rawNode !== 'object') {
    throw new Error(`Line ${lineIndex + 1}, node ${nodeIndex + 1} is not a valid primitive.`)
  }

  const typedNode = rawNode as Record<string, unknown>
  const nodeType = typedNode.type

  if (nodeType === 'text') {
    return normalizeTextNode(typedNode)
  }

  if (nodeType === 'value') {
    return normalizeValueNode(typedNode)
  }

  if (nodeType === 'repeat') {
    return normalizeRepeatNode(typedNode)
  }

  if (nodeType === 'progressBar') {
    return normalizeProgressBarNode(typedNode)
  }

  if (nodeType === 'spinner') {
    return normalizeSpinnerNode(typedNode)
  }

  if (nodeType === 'marquee') {
    return normalizeMarqueeNode(typedNode)
  }

  if (nodeType === 'combineMarks') {
    return normalizeCombineMarksNode(typedNode)
  }

  throw new Error(
    `Line ${lineIndex + 1}, node ${nodeIndex + 1} uses an unsupported primitive: ${String(nodeType)}.`,
  )
}

function normalizeEffect(rawEffect: unknown): EffectDefinition {
  if (!rawEffect || typeof rawEffect !== 'object') {
    throw new Error(
      'The script did not produce an effect. Use print(...) lines, or return defineEffect({ ... }) for the legacy object form.',
    )
  }

  const effect = rawEffect as Record<string, unknown>

  if (!Array.isArray(effect.lines) || effect.lines.length === 0) {
    throw new Error('The effect needs a non-empty lines array.')
  }

  const lines = effect.lines.map((rawLine, lineIndex) => {
    if (!Array.isArray(rawLine) || rawLine.length === 0) {
      throw new Error(`Line ${lineIndex + 1} must be created with line(...).`)
    }

    return rawLine.map((rawNode, nodeIndex) => normalizeNode(rawNode, lineIndex, nodeIndex))
  })

  const name =
    typeof effect.name === 'string' && effect.name.trim().length > 0
      ? effect.name.trim()
      : 'frame-script'

  const description =
    typeof effect.description === 'string' && effect.description.trim().length > 0
      ? effect.description.trim()
      : undefined

  return {
    name,
    description,
    lines,
  }
}

export function summarizeEffect(effect: EffectDefinition) {
  return effect.lines
    .map((line, index) => {
      const summary = line
        .map((node) => {
          if (node.type === 'text') {
            return `text(${node.value.length})`
          }

          if (node.type === 'value') {
            return `value(${node.source})`
          }

          if (node.type === 'repeat') {
            return `repeat(${node.count}, ${node.from})`
          }

          if (node.type === 'spinner') {
            return `spinner(${node.frames.length})`
          }

          if (node.type === 'marquee') {
            return `marquee(${node.width})`
          }

          if (node.type === 'combineMarks') {
            return `combine(${node.depth})`
          }

          return `progress(${node.width})`
        })
        .join(' + ')

      return `line ${index + 1}: ${summary}`
    })
    .join('\n')
}

export function stripLegacyMetadataSource(source: string) {
  if (!source.includes('title(') && !source.includes('describe(')) {
    return source
  }

  const originalLines = source.split(/\r?\n/)
  const filteredLines = originalLines.filter((line) => !LEGACY_METADATA_LINE_PATTERN.test(line))

  if (filteredLines.length === originalLines.length) {
    return source
  }

  return filteredLines.join('\n').replace(/^\s*\n+/, '').replace(/\n{3,}/g, '\n\n')
}

export function compileEffectSource(source: string): CompileResult {
  try {
    const builder = createScriptBuilder()
    const factory = new Function(
      'defineEffect',
      'line',
      'text',
      'repeat',
      'progressBar',
      'bar',
      'spinner',
      'marquee',
      'combine',
      'print',
      'frame',
      'current',
      'total',
      'step',
      'steps',
      'counter',
      `"use strict";\nreturn (() => {\n${source}\n})()\n//# sourceURL=terminimator-effect.js`,
    )

    const rawEffect = factory(
      defineEffect,
      builder.line,
      builder.text,
      builder.repeat,
      builder.progressBar,
      builder.bar,
      builder.spinner,
      builder.marquee,
      builder.combine,
      builder.print,
      builder.frame,
      builder.current,
      builder.total,
      builder.step,
      builder.steps,
      builder.counter,
    )

    if (rawEffect !== undefined) {
      if (builder.hasStructuredOutput()) {
        throw new Error(
          'Choose one source style: either use print(...) lines or return defineEffect({ ... }) for the legacy object form.',
        )
      }

      return {
        ok: true,
        effect: normalizeEffect(rawEffect),
      }
    }

    return {
      ok: true,
      effect: builder.toEffect(),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown effect compilation error.',
    }
  }
}

export const supportedPrimitives: PrimitiveType[] = [
  'text',
  'value',
  'repeat',
  'progressBar',
  'spinner',
  'marquee',
  'combineMarks',
]