import type { PlaybackState } from '../../lib/schema/frame'

export type EffectTemplate = {
  id: string
  name: string
  description: string
  source: string
  playback: PlaybackState
  notes: string[]
}

export type FutureIdea = {
  name: string
  need: string
  why: string
}

export const effectTemplates: EffectTemplate[] = [
  {
    id: 'compile-progress',
    name: 'Compile Progress',
    description: 'Two-line status with animated dots and a progress bar counter.',
    playback: {
      frame: 2,
      current: 9,
      total: 27,
      fps: 4,
      loop: true,
    },
    notes: [
      'Exercises multiline scenes immediately.',
      'Uses both frame-driven motion and progress-driven motion.',
    ],
    source: `print('loading' + repeat('.', { count: 3, from: 'frame' }) + '  ' + bar({ width: 24, filled: '=', empty: '.', showCounter: false }) + ' ' + counter())
print('phase: compiling assets')`,
  },
  {
    id: 'quiet-dots',
    name: 'Quiet Dots',
    description: 'A tiny single-line loader for scripts that want almost no visual noise.',
    playback: {
      frame: 1,
      current: 3,
      total: 10,
      fps: 4,
      loop: true,
    },
    notes: [
      'Smallest viable loader primitive set.',
      'Good baseline for testing pacing decisions.',
    ],
    source: `print('thinking' + repeat('.', { count: 3, from: 'frame' }))`,
  },
  {
    id: 'download-meter',
    name: 'Download Meter',
    description: 'A heavier bar style that stresses fill characters and counter display.',
    playback: {
      frame: 0,
      current: 17,
      total: 40,
      fps: 4,
      loop: false,
    },
    notes: [
      'Tests export fidelity for different bar glyphs.',
      'Keeps the scene single-line while still using the same IR.',
    ],
    source: `print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))`,
  },
  {
    id: 'two-line-status',
    name: 'Two-Line Status',
    description: 'Simple stacked status text above a progress meter.',
    playback: {
      frame: 3,
      current: 6,
      total: 12,
      fps: 4,
      loop: true,
    },
    notes: [
      'Validates that the editor does not assume one line forever.',
      'Good template for future status dashboards.',
    ],
    source: `print('indexing project files')
print(\`progress \${bar({ width: 20, filled: '=', empty: '.', showCounter: false })} \${step}/\${steps}\`)`,
  },
]

export const futureIdeas: FutureIdea[] = [
  {
    name: 'Void Hum',
    need: 'Per-character transforms and combining-mark overlays.',
    why: 'This is the first clear step toward zalgo-style text effects.',
  },
  {
    name: 'Frame Spinner Set',
    need: 'A frame-sequence primitive that swaps between explicit strings.',
    why: 'Classic spinners should not need to be faked with repeat counts forever.',
  },
  {
    name: 'Marquee Logline',
    need: 'Windowing and clipping primitives with horizontal offsets.',
    why: 'Scrolling status text is a common terminal effect outside of progress bars.',
  },
]

export const defaultTemplate = effectTemplates[0]

export function getTemplateById(id: string) {
  return effectTemplates.find((template) => template.id === id) ?? defaultTemplate
}