import type {
  CombineMarksNode,
  EffectDefinition,
  FrameNode,
  MarqueeNode,
  PlaybackState,
  SpinnerNode,
  ValueSource,
} from '../schema/frame'

const DEFAULT_SPINNER_FRAMES = ['|', '/', '-', '\\']
const DEFAULT_COMBINING_MARKS = ['\u0307', '\u0323', '\u0334']

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function repeatCount(node: Extract<FrameNode, { type: 'repeat' }>, frame: number) {
  if (node.from !== 'frame') {
    return clamp(node.count, 0, 32)
  }

  return frame % (clamp(node.count, 0, 32) + 1)
}

function readValue(source: ValueSource, playback: PlaybackState) {
  switch (source) {
    case 'frame':
      return playback.frame
    case 'current':
      return playback.current
    case 'total':
      return playback.total
  }
}

function renderSpinner(node: SpinnerNode, frame: number) {
  const frames = node.frames.length > 0 ? node.frames : DEFAULT_SPINNER_FRAMES
  const index = ((frame % frames.length) + frames.length) % frames.length
  return frames[index] ?? ''
}

function renderMarquee(node: MarqueeNode, frame: number) {
  const width = clamp(node.width, 4, 80)
  const gap = node.gap.length > 0 ? node.gap : ' '
  const source = Array.from(`${node.value}${gap}`)

  if (source.length === 0) {
    return ''
  }

  const start = ((frame % source.length) + source.length) % source.length
  let output = ''

  for (let offset = 0; offset < width; offset += 1) {
    output += source[(start + offset) % source.length] ?? ' '
  }

  return output
}

function renderCombineMarks(node: CombineMarksNode, frame: number) {
  const marks = node.marks.length > 0 ? node.marks : DEFAULT_COMBINING_MARKS
  const seed = node.from === 'frame' ? frame : 0
  let output = ''
  let glyphIndex = 0

  for (const char of Array.from(node.value)) {
    output += char

    if (/\s/u.test(char)) {
      continue
    }

    for (let depthIndex = 0; depthIndex < node.depth; depthIndex += 1) {
      output += marks[(seed + glyphIndex + depthIndex) % marks.length] ?? ''
    }

    glyphIndex += 1
  }

  return output
}

export function renderNode(node: FrameNode, playback: PlaybackState) {
  switch (node.type) {
    case 'text':
      return node.value
    case 'value':
      return String(readValue(node.source, playback))
    case 'repeat':
      return node.value.repeat(repeatCount(node, playback.frame))
    case 'progressBar': {
      const total = Math.max(playback.total, 1)
      const width = clamp(node.width, 4, 48)
      const ratio = clamp(playback.current / total, 0, 1)
      const filledCount = Math.round(ratio * width)
      const filled = node.filled.repeat(filledCount)
      const empty = node.empty.repeat(width - filledCount)
      const counter = node.showCounter ? ` ${playback.current}/${playback.total}` : ''
      return `[${filled}${empty}]${counter}`
    }
    case 'spinner':
      return renderSpinner(node, playback.frame)
    case 'marquee':
      return renderMarquee(node, playback.frame)
    case 'combineMarks':
      return renderCombineMarks(node, playback.frame)
  }
}

export function renderScene(effect: EffectDefinition, playback: PlaybackState) {
  return effect.lines
    .map((line) => line.map((node) => renderNode(node, playback)).join(''))
    .join('\n')
}