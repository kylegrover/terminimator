export type PrimitiveType =
  | 'text'
  | 'value'
  | 'repeat'
  | 'progressBar'
  | 'spinner'
  | 'marquee'
  | 'combineMarks'
  | 'pad'
  | 'gate'

export type AlignMode = 'left' | 'right' | 'center'

export type ValueSource = 'frame' | 'current' | 'total'

export type RepeatSource = 'fixed' | 'frame'

export type TextNode = {
  type: 'text'
  value: string
}

export type ValueNode = {
  type: 'value'
  source: ValueSource
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

export type SpinnerNode = {
  type: 'spinner'
  frames: string[]
}

export type MarqueeNode = {
  type: 'marquee'
  value: string
  width: number
  gap: string
}

export type CombineMarksNode = {
  type: 'combineMarks'
  value: string
  marks: string[]
  depth: number
  from: RepeatSource
}

export type PadNode = {
  type: 'pad'
  parts: FrameNode[]
  width: number
  align: AlignMode
  fill: string
}

export type GateNode = {
  type: 'gate'
  parts: FrameNode[]
  from: ValueSource
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  eq?: number
}

export type FrameNode =
  | TextNode
  | ValueNode
  | RepeatNode
  | ProgressBarNode
  | SpinnerNode
  | MarqueeNode
  | CombineMarksNode
  | PadNode
  | GateNode

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