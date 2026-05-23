import type {
  FrameLine,
  FrameNode,
  PlaygroundState,
  PrimitiveType,
} from '../../lib/schema/frame'

let nextId = 0

function createId(prefix: string) {
  nextId += 1
  return `${prefix}-${nextId}`
}

export function createNode(type: PrimitiveType): FrameNode {
  switch (type) {
    case 'text':
      return { id: createId('node'), type: 'text', value: 'text' }
    case 'repeat':
      return {
        id: createId('node'),
        type: 'repeat',
        value: '.',
        count: 3,
        animated: true,
      }
    case 'progressBar':
      return {
        id: createId('node'),
        type: 'progressBar',
        width: 20,
        filled: '=',
        empty: '.',
        showCounter: true,
      }
  }
}

export function createLine(): FrameLine {
  return {
    id: createId('line'),
    nodes: [createNode('text')],
  }
}

export const defaultPlaygroundState: PlaygroundState = {
  title: 'compile-progress',
  scene: {
    lines: [
      {
        id: createId('line'),
        nodes: [
          { id: createId('node'), type: 'text', value: 'loading' },
          {
            id: createId('node'),
            type: 'repeat',
            value: '.',
            count: 3,
            animated: true,
          },
          { id: createId('node'), type: 'text', value: '  ' },
          {
            id: createId('node'),
            type: 'progressBar',
            width: 24,
            filled: '=',
            empty: '.',
            showCounter: true,
          },
        ],
      },
      {
        id: createId('line'),
        nodes: [{ id: createId('node'), type: 'text', value: 'phase: compiling assets' }],
      },
    ],
  },
  playback: {
    frame: 2,
    current: 9,
    total: 27,
  },
  exportTarget: 'js',
}