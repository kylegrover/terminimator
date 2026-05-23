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
    source: `return defineEffect({
  name: 'compile-progress',
  description: 'Animated dots plus a counter bar on a second line.',
  lines: [
    line(
      text('loading'),
      repeat('.', { count: 3, from: 'frame' }),
      text('  '),
      progressBar({ width: 24, filled: '=', empty: '.', showCounter: true }),
    ),
    line(text('phase: compiling assets')),
  ],
})`,
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
    source: `return defineEffect({
  name: 'quiet-dots',
  description: 'Minimal loader made from text plus one repeat primitive.',
  lines: [
    line(
      text('thinking'),
      repeat('.', { count: 3, from: 'frame' }),
    ),
  ],
})`,
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
    source: `return defineEffect({
  name: 'download-meter',
  description: 'Bar-first progress output with a louder fill style.',
  lines: [
    line(
      text('download '),
      progressBar({ width: 30, filled: '#', empty: '-', showCounter: true }),
    ),
  ],
})`,
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
    source: `return defineEffect({
  name: 'two-line-status',
  description: 'Stacked status text with a simple bar below it.',
  lines: [
    line(text('indexing project files')),
    line(
      text('progress '),
      progressBar({ width: 20, filled: '=', empty: '.', showCounter: true }),
    ),
  ],
})`,
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