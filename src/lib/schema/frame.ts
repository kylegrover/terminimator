export type PrimitiveType = 'text' | 'repeat' | 'progressBar'

export type TextNode = {
  id: string
  type: 'text'
  value: string
}

export type RepeatNode = {
  id: string
  type: 'repeat'
  value: string
  count: number
  animated: boolean
}

export type ProgressBarNode = {
  id: string
  type: 'progressBar'
  width: number
  filled: string
  empty: string
  showCounter: boolean
}

export type FrameNode = TextNode | RepeatNode | ProgressBarNode

export type FrameLine = {
  id: string
  nodes: FrameNode[]
}

export type FrameScene = {
  lines: FrameLine[]
}

export type PlaybackState = {
  frame: number
  current: number
  total: number
}

export type ExportTarget = 'js' | 'py' | 'rust'

export type PlaygroundState = {
  title: string
  scene: FrameScene
  playback: PlaybackState
  exportTarget: ExportTarget
}