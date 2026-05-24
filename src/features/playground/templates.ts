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
    id: 'frame-spinner-set',
    name: 'Frame Spinner Set',
    description: 'Explicit spinner frames driven directly by the playback frame.',
    playback: {
      frame: 5,
      current: 4,
      total: 12,
      fps: 8,
      loop: true,
    },
    notes: [
      'First pass at real spinner primitives instead of fake repeat counts.',
      'Good for checking whether exports preserve frame stepping exactly.',
    ],
    source: `print(spinner('|', '/', '-', '\\\\') + ' syncing package graph')
print('step ' + counter())`,
  },
  {
    id: 'padded-ledger',
    name: 'Padded Ledger',
    description: 'Fixed-width columns built from pad(...) so labels and counters stay aligned.',
    playback: {
      frame: 2,
      current: 14,
      total: 32,
      fps: 4,
      loop: true,
    },
    notes: [
      'First pass at layout helpers without introducing a full grid system.',
      'Useful for status boards, counters, and terminal dashboards.',
    ],
    source: `print(pad('queue depth', 20, { fill: '.' }) + counter())
print(pad('edge cache', 20, { fill: '.' }) + 'warm')
print(pad('region us-east-1', 20) + pad(step + '/' + steps, 12, { align: 'right' }))`,
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
      loop: true,
    },
    notes: [
      'Tests export fidelity for different bar glyphs.',
      'Keeps the scene single-line while still using the same IR.',
    ],
    source: `print('download ' + bar({ width: 30, filled: '#', empty: '-', showCounter: true }))`,
  },
  {
    id: 'marquee-logline',
    name: 'Marquee Logline',
    description: 'A clipped scrolling line for longer deployment or status text.',
    playback: {
      frame: 11,
      current: 2,
      total: 6,
      fps: 5,
      loop: true,
    },
    notes: [
      'Exercises horizontal windowing with wraparound.',
      'Useful for log tails, deploy banners, and long task labels.',
    ],
    source: `print(marquee('deploying edge regions across six zones', { width: 28, gap: '   ' }))
print('rollout ' + counter())`,
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
  {
    id: 'phase-gates',
    name: 'Phase Gates',
    description: 'Conditional fragments that switch copy as progress crosses thresholds.',
    playback: {
      frame: 3,
      current: 5,
      total: 9,
      fps: 5,
      loop: true,
    },
    notes: [
      'Shows how gate(...) can swap status copy without branching the whole script.',
      'Good test for threshold-driven terminal copy changes.',
    ],
    source: `print('deploy ' + bar({ width: 18, showCounter: false }) + ' ' + counter())
print('phase: ' + gate({ from: 'current', lt: 3 }, 'validating manifests') + gate({ from: 'current', gte: 3, lt: 6 }, 'uploading bundles') + gate({ from: 'current', gte: 6 }, 'verifying cache propagation'))`,
  },
  {
    id: 'void-hum',
    name: 'Void Hum',
    description: 'Combining marks layered over text to push into stranger terminal territory.',
    playback: {
      frame: 4,
      current: 7,
      total: 9,
      fps: 6,
      loop: true,
    },
    notes: [
      'The first real step toward noisier text effects and zalgo-style motion.',
      'Uses deterministic combining marks so preview and export stay in sync.',
    ],
    source: `print(combine('signal degraded', { depth: 2, marks: ['\u0307', '\u0323', '\u0334'] }))
print('carrier ' + repeat('~', { count: 6, from: 'frame' }))`,
  },
]

export const futureIdeas: FutureIdea[] = [
  {
    name: 'ANSI Paint',
    need: 'Color and emphasis spans that export cleanly across targets.',
    why: 'Once layout and motion feel solid, visual styling is the next obvious layer people will reach for.',
  },
  {
    name: 'Width Trim',
    need: 'Clip, truncate, and ellipsis helpers that respect fixed terminal widths.',
    why: 'Marquee handles scrolling, but real dashboards also need deliberate clipping.',
  },
  {
    name: 'Seeded Jitter',
    need: 'Deterministic pseudo-random offsets and scrambles keyed by frame or step.',
    why: 'Glitchier motion and unstable text effects will need controlled randomness, not true chaos.',
  },
]

export const defaultTemplate = effectTemplates[0]

export function getTemplateById(id: string) {
  return effectTemplates.find((template) => template.id === id) ?? defaultTemplate
}