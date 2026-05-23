import type {
  EffectDefinition,
  FrameNode,
  PrimitiveType,
  ProgressBarNode,
  RepeatNode,
  RepeatSource,
  TextNode,
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

type DslEffectDefinition = {
  name?: unknown
  description?: unknown
  lines?: unknown
}

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
    signature: 'return defineEffect({ name, description?, lines: [...] })',
    detail: 'Every source snippet should return one effect definition.',
  },
  {
    signature: 'line(text(...), repeat(...), progressBar(...))',
    detail: 'A line becomes one terminal row. Multiple lines already render as multiline output.',
  },
  {
    signature: "repeat('.', { count: 3, from: 'frame' })",
    detail: 'Use frame-driven repeat when the playback frame should animate the node.',
  },
  {
    signature: 'progressBar({ width: 24, filled: "=", empty: ".", showCounter: true })',
    detail: 'The bar reads current and total from the playback controls.',
  },
] as const

function clampInteger(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function text(value: string): TextNode {
  return {
    type: 'text',
    value: String(value),
  }
}

function repeat(value: string, options: DslRepeatOptions = {}): RepeatNode {
  return {
    type: 'repeat',
    value: String(value),
    count: clampInteger(options.count ?? 3, 0, 16),
    from: options.from === 'frame' ? 'frame' : 'fixed',
  }
}

function progressBar(options: DslProgressBarOptions = {}): ProgressBarNode {
  return {
    type: 'progressBar',
    width: clampInteger(options.width ?? 24, 4, 48),
    filled: String(options.filled ?? '='),
    empty: String(options.empty ?? '.'),
    showCounter: options.showCounter ?? true,
  }
}

function line(...nodes: FrameNode[]) {
  return nodes
}

function defineEffect(effect: DslEffectDefinition) {
  return effect
}

function normalizeTextNode(rawNode: Record<string, unknown>): TextNode {
  return {
    type: 'text',
    value: String(rawNode.value ?? ''),
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

function normalizeNode(rawNode: unknown, lineIndex: number, nodeIndex: number): FrameNode {
  if (!rawNode || typeof rawNode !== 'object') {
    throw new Error(`Line ${lineIndex + 1}, node ${nodeIndex + 1} is not a valid primitive.`)
  }

  const typedNode = rawNode as Record<string, unknown>
  const nodeType = typedNode.type

  if (nodeType === 'text') {
    return normalizeTextNode(typedNode)
  }

  if (nodeType === 'repeat') {
    return normalizeRepeatNode(typedNode)
  }

  if (nodeType === 'progressBar') {
    return normalizeProgressBarNode(typedNode)
  }

  throw new Error(
    `Line ${lineIndex + 1}, node ${nodeIndex + 1} uses an unsupported primitive: ${String(nodeType)}.`,
  )
}

function normalizeEffect(rawEffect: unknown): EffectDefinition {
  if (!rawEffect || typeof rawEffect !== 'object') {
    throw new Error('The editor must return defineEffect({ ... }).')
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
      : 'untitled-effect'

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

          if (node.type === 'repeat') {
            return `repeat(${node.count}, ${node.from})`
          }

          return `progress(${node.width})`
        })
        .join(' + ')

      return `line ${index + 1}: ${summary}`
    })
    .join('\n')
}

export function compileEffectSource(source: string): CompileResult {
  try {
    const factory = new Function(
      'defineEffect',
      'line',
      'text',
      'repeat',
      'progressBar',
      `"use strict";\nreturn (() => {\n${source}\n})()\n//# sourceURL=terminimator-effect.js`,
    )

    const rawEffect = factory(defineEffect, line, text, repeat, progressBar)
    return {
      ok: true,
      effect: normalizeEffect(rawEffect),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown effect compilation error.',
    }
  }
}

export const supportedPrimitives: PrimitiveType[] = ['text', 'repeat', 'progressBar']