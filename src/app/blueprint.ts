export type DetailCard = {
  title: string
  description: string
}

export type StackChoice = {
  name: string
  timing: string
  reason: string
}

export type RepoSlice = {
  path: string
  purpose: string
}

export type Phase = {
  name: string
  goal: string
  exit: string
}

export type Question = {
  question: string
  why: string
}

export const hero = {
  eyebrow: 'Static planning scaffold',
  title: 'Terminal Shadertoy for CLI effects',
  summary:
    'Start with a fast browser playground for spinners, loaders, progress bars, and text transitions. Keep the repo small, keep the product static, and let every later mode build on the same frame model.',
  chips: [
    'Static SPA first',
    'JavaScript with rails',
    'Shared frame IR',
    'Export to Python / Node / Rust / Bash',
  ],
}

export const metrics = [
  { label: 'authoring surface', value: 'Monaco + helper API' },
  { label: 'preview target', value: 'xterm.js terminal' },
  { label: 'runtime boundary', value: 'Worker + sandboxed JS' },
  { label: 'future mode', value: 'Node graph on same IR' },
]

export const frameSketch = `export function renderFrame(ctx, fx) {
  return fx.line([
    fx.text("loading"),
    fx.repeat(".", ctx.frame % 4),
    fx.space(2),
    fx.progressBar({
      current: ctx.step,
      total: ctx.total,
      width: 24,
    }),
  ])
}`

export const terminalPreview = `$ terminimator demo
time     03.20s
frame    128
loading...  [========>...............] 9 / 27
export    python | node | rust | bash`

export const principles: DetailCard[] = [
  {
    title: 'One app until complexity earns more structure',
    description:
      'Keep the repo as a single Vite application until a second deployable or package genuinely exists. That keeps builds, tooling, and mental overhead low.',
  },
  {
    title: 'Author in JS, return structure not side effects',
    description:
      'User code should return frame data built from host helpers. Avoid allowing arbitrary stdout writes, timers, or full transpilation of freeform JavaScript.',
  },
  {
    title: 'Shared IR before exporter work',
    description:
      'Preview, templates, exporters, and the future graph editor all need the same canonical frame model. Lock that before building multiple output targets.',
  },
  {
    title: 'Templates teach us the future nodes',
    description:
      'The first curated effects should reveal what the graph system eventually needs. Do not invent a node catalog in the abstract.',
  },
]

export const stackChoices: StackChoice[] = [
  {
    name: 'Vite + React + TypeScript',
    timing: 'Now',
    reason:
      'Fast static deployment, lightweight tooling, and enough structure for a real app without introducing framework or server complexity.',
  },
  {
    name: 'Monaco Editor',
    timing: 'Phase 1',
    reason:
      'Gives us a familiar authoring surface, basic language services, and a proven browser editor instead of maintaining a custom code widget.',
  },
  {
    name: 'xterm.js',
    timing: 'Phase 1',
    reason:
      'Lets the preview behave like a terminal instead of a fake DOM mockup, which matters once ANSI, cursor motion, and redraw behavior arrive.',
  },
  {
    name: 'quickjs-emscripten',
    timing: 'Phase 1',
    reason:
      'Fits the static-app goal while giving us a safer JS runtime with explicit host APIs and execution limits.',
  },
  {
    name: 'Zod',
    timing: 'Phase 2',
    reason:
      'Useful once effects, presets, and export options become serializable inputs that need dependable validation.',
  },
]

export const repoTree = `terminimator/
  docs/
    architecture.md
  src/
    app/
      App.tsx
      blueprint.ts
    features/
      playground/
      templates/
      export/
    lib/
      schema/
      runtime/
      preview/
      exporters/
      utils/
    styles/
      index.css
  index.html
  package.json
  vite.config.ts`

export const repoSlices: RepoSlice[] = [
  {
    path: 'src/features/playground',
    purpose:
      'Own the editor, live preview dock, playback controls, and mock time or progress inputs.',
  },
  {
    path: 'src/features/templates',
    purpose:
      'Own starter effects, metadata, categories, and curated examples that seed the product language.',
  },
  {
    path: 'src/features/export',
    purpose:
      'Own target selection, generated output, copy or download flows, and exporter-specific warnings.',
  },
  {
    path: 'src/lib/schema',
    purpose:
      'Define the shared frame IR, config types, and validation points that everything else builds on.',
  },
  {
    path: 'src/lib/runtime',
    purpose:
      'Run user-authored code in a worker sandbox and expose the allowed helper APIs.',
  },
  {
    path: 'src/lib/preview',
    purpose:
      'Translate frame output into terminal playback state and xterm-friendly rendering behavior.',
  },
  {
    path: 'src/lib/exporters',
    purpose:
      'Compile shared effect definitions into Python, Node, Rust, and a smaller Bash-safe subset.',
  },
  {
    path: 'src/lib/utils',
    purpose:
      'Collect the few cross-cutting helpers we actually reuse, like width math and formatting.',
  },
]

export const phases: Phase[] = [
  {
    name: 'Phase 0',
    goal: 'Lock scope, repo shape, and technical posture.',
    exit: 'A clean static shell, written architecture, and no accidental overengineering.',
  },
  {
    name: 'Phase 1',
    goal: 'Ship the browser playground.',
    exit: 'Monaco, xterm, playback controls, starter templates, and a stable frame contract.',
  },
  {
    name: 'Phase 2',
    goal: 'Add export adapters on top of the shared IR.',
    exit: 'Reliable Node, Python, and Rust export plus a clearly scoped Bash subset.',
  },
  {
    name: 'Phase 3',
    goal: 'Turn the playground into a reusable tool.',
    exit: 'Preset library, saved configs, URL or file-based sharing, and strong fixtures for regression checks.',
  },
  {
    name: 'Phase 4',
    goal: 'Layer on graph authoring after the primitives are proven.',
    exit: 'A node graph that compiles to the same IR instead of inventing a second execution model.',
  },
]

export const risks: DetailCard[] = [
  {
    title: 'Cross-language parity pressure',
    description:
      'If we let users write arbitrary JavaScript, exporter fidelity collapses. The IR and helper surface must stay opinionated.',
  },
  {
    title: 'Unicode width and combining marks',
    description:
      'Effects like zalgo expose the difference between byte length and display width. Width math cannot rely on raw string length.',
  },
  {
    title: 'Bash support ceiling',
    description:
      'Bash lacks pleasant floating-point math and timing primitives. The Bash exporter should target a deliberate safe subset, not fake full parity.',
  },
  {
    title: 'Sandbox performance',
    description:
      'The preview loop needs to feel immediate without giving user code full control over the main thread or the browser environment.',
  },
]

export const openQuestions: Question[] = [
  {
    question: 'What is the first-frame model: single line, multi-line, or both?',
    why: 'Progress bars can start single-line, but scene structure affects preview, export templates, and terminal clearing logic.',
  },
  {
    question: 'Which primitives are built in for v1?',
    why: 'The first helper set defines both the exporter surface and the future node vocabulary. We should choose a small, strong core.',
  },
  {
    question: 'How much of Bash do we officially promise?',
    why: 'This is a product decision, not just an implementation detail. Clear boundaries prevent a long tail of brittle hacks.',
  },
  {
    question: 'How do users share work before any backend exists?',
    why: 'URL compression, local storage, and downloadable JSON are all static-friendly, but they push us toward different data shapes.',
  },
]