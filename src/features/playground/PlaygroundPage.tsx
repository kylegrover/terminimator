import { useEffect, useState } from 'react'
import { generateCode } from '../../lib/exporters/generateCode'
import { renderScene } from '../../lib/preview/renderScene'
import type { ExportTarget, PlaybackState, PlaygroundState } from '../../lib/schema/frame'
import { compileEffectSource, dslReference, summarizeEffect } from '../../lib/runtime/effectDsl'
import { decodeState, encodeState } from '../../lib/utils/urlState'
import {
  defaultTemplate,
  effectTemplates,
  futureIdeas,
  getTemplateById,
} from './templates'

const STATE_PARAM = 'state'
const MAX_FRAME = 48
const MAX_TOTAL = 100
const MAX_FPS = 12

const targetLabels: Record<ExportTarget, string> = {
  js: 'JS / Node',
  py: 'Python',
  rust: 'Rust',
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function createDefaultState(): PlaygroundState {
  return {
    source: defaultTemplate.source,
    activeTemplateId: defaultTemplate.id,
    exportTarget: 'js',
    playback: { ...defaultTemplate.playback },
  }
}

function normalizePlayback(rawPlayback: Partial<PlaybackState> | undefined, fallback: PlaybackState) {
  const total = clampInteger(Number(rawPlayback?.total ?? fallback.total), 1, MAX_TOTAL)

  return {
    frame: clampInteger(Number(rawPlayback?.frame ?? fallback.frame), 0, MAX_FRAME),
    current: clampInteger(Number(rawPlayback?.current ?? fallback.current), 0, total),
    total,
    fps: clampInteger(Number(rawPlayback?.fps ?? fallback.fps), 1, MAX_FPS),
    loop: typeof rawPlayback?.loop === 'boolean' ? rawPlayback.loop : fallback.loop,
  }
}

function loadInitialState() {
  const fallback = createDefaultState()

  if (typeof window === 'undefined') {
    return fallback
  }

  const url = new URL(window.location.href)
  const encoded = url.searchParams.get(STATE_PARAM)

  if (!encoded) {
    return fallback
  }

  try {
    const parsed = decodeState<Partial<PlaygroundState>>(encoded)

    return {
      source: typeof parsed.source === 'string' ? parsed.source : fallback.source,
      activeTemplateId:
        typeof parsed.activeTemplateId === 'string'
          ? parsed.activeTemplateId
          : fallback.activeTemplateId,
      exportTarget:
        parsed.exportTarget === 'js' || parsed.exportTarget === 'py' || parsed.exportTarget === 'rust'
          ? parsed.exportTarget
          : fallback.exportTarget,
      playback: normalizePlayback(parsed.playback, fallback.playback),
    }
  } catch {
    return fallback
  }
}

function shareUrl(encodedState: string) {
  if (typeof window === 'undefined') {
    return ''
  }

  const url = new URL(window.location.href)
  url.searchParams.set(STATE_PARAM, encodedState)
  return url.toString()
}

async function copyText(value: string) {
  if (!navigator.clipboard) {
    return false
  }

  await navigator.clipboard.writeText(value)
  return true
}

export function PlaygroundPage() {
  const [state, setState] = useState(loadInitialState)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const compileResult = compileEffectSource(state.source)
  const effect = compileResult.ok ? compileResult.effect : null
  const compileError = compileResult.ok ? null : compileResult.error
  const playbackActive =
    isPlaying && Boolean(effect) && (state.playback.loop || state.playback.current < state.playback.total)
  const previewText = effect
    ? renderScene(effect, state.playback)
    : `Compile error\n\n${compileError}`
  const generatedCode = effect
    ? generateCode(effect, state.playback, state.exportTarget)
    : '// fix the editor source before export is available'
  const currentShareUrl = shareUrl(encodeState(state))
  const currentTemplate = effectTemplates.find((template) => template.id === state.activeTemplateId)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set(STATE_PARAM, encodeState(state))
    window.history.replaceState({}, '', url)
  }, [state])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(null), 1200)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!playbackActive) {
      return
    }

    const delay = Math.max(1, Math.round(1000 / Math.max(state.playback.fps, 1)))
    const timer = window.setInterval(() => {
      setState((current) => {
        const total = Math.max(current.playback.total, 1)
        const nextFrame = current.playback.frame + 1

        if (current.playback.loop) {
          return {
            ...current,
            playback: {
              ...current.playback,
              frame: nextFrame,
              current:
                current.playback.current >= total ? 0 : current.playback.current + 1,
            },
          }
        }

        return {
          ...current,
          playback: {
            ...current.playback,
            frame: nextFrame,
            current: Math.min(total, current.playback.current + 1),
          },
        }
      })
    }, delay)

    return () => window.clearInterval(timer)
  }, [playbackActive, state.playback.fps, state.playback.loop])

  function loadTemplate(templateId: string) {
    const template = getTemplateById(templateId)
    setIsPlaying(false)
    setState((current) => ({
      ...current,
      source: template.source,
      activeTemplateId: template.id,
      playback: { ...template.playback },
    }))
  }

  function updateSource(value: string) {
    setIsPlaying(false)
    setState((current) => ({
      ...current,
      source: value,
      activeTemplateId: 'custom',
    }))
  }

  function setExportTarget(target: ExportTarget) {
    setState((current) => ({
      ...current,
      exportTarget: target,
    }))
  }

  function updateFrame(rawValue: string) {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        frame: clampInteger(Number(rawValue), 0, MAX_FRAME),
      },
    }))
  }

  function updateCurrent(rawValue: string) {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        current: clampInteger(Number(rawValue), 0, current.playback.total),
      },
    }))
  }

  function updateTotal(rawValue: string) {
    setState((current) => {
      const total = clampInteger(Number(rawValue), 1, MAX_TOTAL)

      return {
        ...current,
        playback: {
          ...current.playback,
          total,
          current: Math.min(current.playback.current, total),
        },
      }
    })
  }

  function updateFps(rawValue: string) {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        fps: clampInteger(Number(rawValue), 1, MAX_FPS),
      },
    }))
  }

  function updateLoop(loop: boolean) {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        loop,
      },
    }))
  }

  function resetPlayback() {
    setIsPlaying(false)
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        frame: 0,
        current: 0,
      },
    }))
  }

  function togglePlayback() {
    if (!effect) {
      return
    }

    if (!playbackActive && !state.playback.loop && state.playback.current >= state.playback.total) {
      setState((current) => ({
        ...current,
        playback: {
          ...current.playback,
          frame: 0,
          current: 0,
        },
      }))
    }

    setIsPlaying(!playbackActive)
  }

  return (
    <div className="page">
      <main className="code-workspace">
        <section className="panel source-panel">
          <div className="editor-toolbar">
            <div>
              <p className="section-kicker">Frame script</p>
              <h2>Write the lines</h2>
              <p className="section-note">
                One print(...) call equals one terminal row. bar(), repeat(), frame, step,
                and steps can sit inline with normal JS strings.
              </p>
            </div>

            <label className="field template-select-field">
              <span>Starter</span>
              <select
                className="template-select"
                value={currentTemplate ? currentTemplate.id : 'custom'}
                onChange={(event) => {
                  const templateId = event.target.value

                  if (templateId === 'custom') {
                    setState((current) => ({
                      ...current,
                      activeTemplateId: 'custom',
                    }))
                    return
                  }

                  loadTemplate(templateId)
                }}
              >
                <option value="custom">Custom source</option>
                {effectTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="status-row">
            <span className={effect ? 'status-badge is-success' : 'status-badge is-error'}>
              {effect ? 'Compiled' : 'Compile error'}
            </span>
            <span className="status-badge is-muted">
              {currentTemplate ? currentTemplate.name : 'Custom source'}
            </span>
            <span className="status-badge is-muted">
              {state.playback.current}/{state.playback.total} at {state.playback.fps} fps
            </span>
          </div>

          <p className="template-context">
            {currentTemplate
              ? `${currentTemplate.description} ${currentTemplate.notes[0]}`
              : 'The editor is in custom mode. Pick a starter from the dropdown if you want to replace the current source.'}
          </p>

          <textarea
            className="source-editor"
            spellCheck={false}
            value={state.source}
            onChange={(event) => updateSource(event.target.value)}
          />

          {effect ? (
            <div className="summary-card">
              <p className="section-kicker">Compiled effect</p>
              <p className="section-note">{effect.description ?? 'No description set in the source.'}</p>
              <pre>{summarizeEffect(effect)}</pre>
            </div>
          ) : (
            <div className="error-card">
              <p className="section-kicker">Compiler output</p>
              <pre>{compileError}</pre>
            </div>
          )}

          <div className="details-grid">
            <div className="summary-card">
              <p className="section-kicker">Helper surface</p>
              <div className="helper-list">
                {dslReference.map((entry) => (
                  <article className="helper-row" key={entry.signature}>
                    <h3>{entry.signature}</h3>
                    <p>{entry.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="summary-card">
              <p className="section-kicker">Next primitives</p>
              <div className="idea-list">
                {futureIdeas.map((idea) => (
                  <article className="idea-card" key={idea.name}>
                    <h3>{idea.name}</h3>
                    <p>{idea.need}</p>
                    <p className="idea-why">{idea.why}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="section-header">
            <div>
              <p className="section-kicker">Playback</p>
              <h2>Preview and export</h2>
            </div>
            <p className="section-note">4 fps default, loop optional, controls always visible.</p>
          </div>

          <div className="control-grid compact-grid">
            <label className="field">
              <span>frame</span>
              <input
                type="range"
                min="0"
                max={String(MAX_FRAME)}
                value={state.playback.frame}
                onChange={(event) => updateFrame(event.target.value)}
              />
            </label>

            <label className="field">
              <span>current</span>
              <input
                type="range"
                min="0"
                max={String(state.playback.total)}
                value={state.playback.current}
                onChange={(event) => updateCurrent(event.target.value)}
              />
            </label>

            <label className="field">
              <span>total</span>
              <input
                type="number"
                min="1"
                max={String(MAX_TOTAL)}
                value={state.playback.total}
                onChange={(event) => updateTotal(event.target.value)}
              />
            </label>

            <label className="field">
              <span>fps</span>
              <input
                type="number"
                min="1"
                max={String(MAX_FPS)}
                value={state.playback.fps}
                onChange={(event) => updateFps(event.target.value)}
              />
            </label>
          </div>

          <label className="toggle-field">
            <input
              type="checkbox"
              checked={state.playback.loop}
              onChange={(event) => updateLoop(event.target.checked)}
            />
            <span>play in a loop</span>
          </label>

          <div className="code-actions">
            <button
              type="button"
              className="primary-button"
              onClick={togglePlayback}
              disabled={!effect}
            >
              {playbackActive ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="secondary-button" onClick={resetPlayback}>
              Reset playback
            </button>
          </div>

          <div className="terminal-window">
            <div className="window-bar">
              <div className="window-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>{effect?.name ?? 'compiler-output'}.terminal</p>
            </div>
            <pre className="terminal-output">{previewText}</pre>
          </div>

          <div className="section-header export-header">
            <div>
              <p className="section-kicker">Export</p>
              <h2>Standalone code</h2>
            </div>
            <div className="tab-row" role="tablist" aria-label="Export target">
              {Object.entries(targetLabels).map(([target, label]) => (
                <button
                  type="button"
                  key={target}
                  role="tab"
                  className={target === state.exportTarget ? 'tab-button is-active' : 'tab-button'}
                  aria-selected={target === state.exportTarget}
                  onClick={() => setExportTarget(target as ExportTarget)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="code-actions">
            <button
              type="button"
              className="primary-button"
              disabled={!effect}
              onClick={async () => {
                if (effect && (await copyText(generatedCode))) {
                  setCopied('code')
                }
              }}
            >
              {copied === 'code' ? 'Copied code' : 'Copy code'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={async () => {
                if (await copyText(currentShareUrl)) {
                  setCopied('link')
                }
              }}
            >
              {copied === 'link' ? 'Copied link' : 'Copy share link'}
            </button>
          </div>

          <pre className="export-code">{generatedCode}</pre>

          <label className="field share-field">
            <span>shareable URL state</span>
            <textarea readOnly rows={3} value={currentShareUrl} />
          </label>
        </section>
      </main>
    </div>
  )
}