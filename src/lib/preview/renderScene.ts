import type { FrameNode, FrameScene, PlaybackState } from '../schema/frame'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function repeatCount(node: Extract<FrameNode, { type: 'repeat' }>, frame: number) {
  if (!node.animated) {
    return clamp(node.count, 0, 32)
  }

  return frame % (clamp(node.count, 0, 32) + 1)
}

export function renderNode(node: FrameNode, playback: PlaybackState) {
  switch (node.type) {
    case 'text':
      return node.value
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
  }
}

export function renderScene(scene: FrameScene, playback: PlaybackState) {
  return scene.lines
    .map((line) => line.nodes.map((node) => renderNode(node, playback)).join(''))
    .join('\n')
}