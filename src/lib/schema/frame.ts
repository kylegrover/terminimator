export type PrimitiveType = 'text' | 'repeat' | 'progressBar'

export type RepeatSource = 'fixed' | 'frame'

export type TextNode = {
  type: 'text'
  value: string
}

export type RepeatNode = {
  type: 'repeat'
  value: string
  count: number
  from: RepeatSource
}

export type ProgressBarNode = {
  type: 'progressBar'
  width: number
  filled: string
  empty: string
  showCounter: boolean
}

export type FrameNode = TextNode | RepeatNode | ProgressBarNode

export type FrameScene = {
  lines: FrameNode[][]
}

export type EffectDefinition = {
  name: string
  description?: string
  lines: FrameNode[][]
}

export type PlaybackState = {
  frame: number
  current: number
  total: number
  fps: number
  loop: boolean
}

export type ExportTarget = 'js' | 'py' | 'rust'

export type PlaygroundState = {
  source: string
  activeTemplateId: string
  playback: PlaybackState
  exportTarget: ExportTarget
}