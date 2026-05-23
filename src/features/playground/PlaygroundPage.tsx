import { useEffect, useState } from 'react'
import { generateCode, summarizeScene } from '../../lib/exporters/generateCode'
import { renderScene } from '../../lib/preview/renderScene'
import type {
  FrameNode,
  PlaygroundState,
  PrimitiveType,
} from '../../lib/schema/frame'
import { decodeState, encodeState } from '../../lib/utils/urlState'
import { createLine, createNode, defaultPlaygroundState } from './defaultState'

const STATE_PARAM = 'state'

const targetLabels: Record<PlaygroundState['exportTarget'], string> = {
  js: 'JS / Node',
  py: 'Python',
  rust: 'Rust',
}

const primitiveLabels: Record<PrimitiveType, string> = {
  text: 'Text',
  repeat: 'Repeat',
  progressBar: 'Progress bar',
}

function cloneDefaultState() {
  return structuredClone(defaultPlaygroundState)
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return cloneDefaultState()
  }

  const url = new URL(window.location.href)
  const encoded = url.searchParams.get(STATE_PARAM)

  if (!encoded) {
    return cloneDefaultState()
  }

  try {
    return decodeState<PlaygroundState>(encoded)
  } catch {
    return cloneDefaultState()
  }
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function shareUrl(encoded: string) {
  if (typeof window === 'undefined') {
    return ''
  }

  const url = new URL(window.location.href)
  url.searchParams.set(STATE_PARAM, encoded)
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
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const encodedState = encodeState(state)
  const currentShareUrl = shareUrl(encodedState)
  const previewText = renderScene(state.scene, state.playback)
  const generatedCode = generateCode(state)
  const sceneSummary = summarizeScene(state)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set(STATE_PARAM, encodedState)
    window.history.replaceState({}, '', url)
  }, [encodedState])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(null), 1200)
    return () => window.clearTimeout(timer)
  }, [copied])

  function updateTitle(value: string) {
    setState((current) => ({ ...current, title: value }))
  }

  function updatePlayback(field: 'frame' | 'current' | 'total', rawValue: string) {
    const parsed = Number(rawValue)

    setState((current) => {
      const total = field === 'total' ? clampInteger(parsed, 1, 100) : current.playback.total
      const next = {
        ...current.playback,
        [field]: clampInteger(parsed, 0, field === 'frame' ? 24 : total),
      }

      return {
        ...current,
        playback: {
          frame: field === 'frame' ? next.frame : current.playback.frame,
          total,
          current:
            field === 'current'
              ? clampInteger(parsed, 0, total)
              : clampInteger(current.playback.current, 0, total),
        },
      }
    })
  }

  function setExportTarget(target: PlaygroundState['exportTarget']) {
    setState((current) => ({ ...current, exportTarget: target }))
  }

  function resetStarter() {
    setState(cloneDefaultState())
  }

  function addLine() {
    setState((current) => ({
      ...current,
      scene: {
        lines: [...current.scene.lines, createLine()],
      },
    }))
  }

  function removeLine(lineId: string) {
    setState((current) => {
      if (current.scene.lines.length === 1) {
        return current
      }

      return {
        ...current,
        scene: {
          lines: current.scene.lines.filter((line) => line.id !== lineId),
        },
      }
    })
  }

  function addNode(lineId: string, type: PrimitiveType) {
    setState((current) => ({
      ...current,
      scene: {
        lines: current.scene.lines.map((line) =>
          line.id === lineId ? { ...line, nodes: [...line.nodes, createNode(type)] } : line,
        ),
      },
    }))
  }

  function removeNode(lineId: string, nodeId: string) {
    setState((current) => ({
      ...current,
      scene: {
        lines: current.scene.lines.map((line) => {
          if (line.id !== lineId || line.nodes.length === 1) {
            return line
          }

          return { ...line, nodes: line.nodes.filter((node) => node.id !== nodeId) }
        }),
      },
    }))
  }

  function updateNode(lineId: string, nodeId: string, updater: (node: FrameNode) => FrameNode) {
    setState((current) => ({
      ...current,
      scene: {
        lines: current.scene.lines.map((line) => ({
          ...line,
          nodes: line.nodes.map((node) => {
            if (line.id === lineId && node.id === nodeId) {
              return updater(node)
            }

            return node
          }),
        })),
      },
    }))
  }

  return (
    <div className="page">
      <header className="hero-shell panel">
        <div className="hero-copy">
          <p className="eyebrow">First slice playground</p>
          <h1>Terminal Shadertoy, trimmed to the core</h1>
          <p className="lede">
            JS, Python, and Rust first. Single-line friendly, but the scene model already
            expands to multiline. State lives in the URL, and the code export is the
            persistence story.
          </p>
          <div className="chip-row" aria-label="Current scope">
            <span className="chip">Targets: JS / Python / Rust</span>
            <span className="chip">Primitives: text / repeat / progress bar</span>
            <span className="chip">Multiline-capable scene</span>
            <span className="chip">Share via URL state</span>
          </div>
        </div>

        <div className="hero-stats">
          <article className="metric-card">
            <p className="metric-label">playback</p>
            <p className="metric-value">frame {state.playback.frame}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">progress</p>
            <p className="metric-value">
              {state.playback.current}/{state.playback.total}
            </p>
          </article>
          <article className="metric-card">
            <p className="metric-label">lines</p>
            <p className="metric-value">{state.scene.lines.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">export</p>
            <p className="metric-value">{targetLabels[state.exportTarget]}</p>
          </article>
        </div>
      </header>

      <main className="workspace-grid">
        <section className="panel editor-panel">
          <div className="section-header">
            <div>
              <p className="section-kicker">Composer</p>
              <h2>Scene editor</h2>
            </div>
            <button type="button" className="secondary-button" onClick={resetStarter}>
              Reset starter
            </button>
          </div>

          <div className="control-grid compact-grid">
            <label className="field">
              <span>effect name</span>
              <input
                value={state.title}
                onChange={(event) => updateTitle(event.target.value)}
              />
            </label>

            <label className="field">
              <span>frame</span>
              <input
                type="range"
                min="0"
                max="24"
                value={state.playback.frame}
                onChange={(event) => updatePlayback('frame', event.target.value)}
              />
            </label>

            <label className="field">
              <span>current</span>
              <input
                type="range"
                min="0"
                max={state.playback.total}
                value={state.playback.current}
                onChange={(event) => updatePlayback('current', event.target.value)}
              />
            </label>

            <label className="field">
              <span>total</span>
              <input
                type="number"
                min="1"
                max="100"
                value={state.playback.total}
                onChange={(event) => updatePlayback('total', event.target.value)}
              />
            </label>
          </div>

          <div className="line-stack">
            {state.scene.lines.map((line, lineIndex) => (
              <article className="line-card" key={line.id}>
                <div className="line-header">
                  <div>
                    <p className="line-label">line {lineIndex + 1}</p>
                    <p className="line-meta">{line.nodes.length} segment(s)</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => removeLine(line.id)}
                  >
                    Remove line
                  </button>
                </div>

                <div className="node-stack">
                  {line.nodes.map((node) => (
                    <article className="node-card" key={node.id}>
                      <div className="node-header">
                        <span className="badge">{primitiveLabels[node.type]}</span>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => removeNode(line.id, node.id)}
                        >
                          Remove
                        </button>
                      </div>

                      {node.type === 'text' ? (
                        <label className="field">
                          <span>text</span>
                          <input
                            value={node.value}
                            onChange={(event) =>
                              updateNode(line.id, node.id, (current) =>
                                current.type === 'text'
                                  ? { ...current, value: event.target.value }
                                  : current,
                              )
                            }
                          />
                        </label>
                      ) : null}

                      {node.type === 'repeat' ? (
                        <div className="control-grid">
                          <label className="field">
                            <span>unit</span>
                            <input
                              value={node.value}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'repeat'
                                    ? { ...current, value: event.target.value }
                                    : current,
                                )
                              }
                            />
                          </label>

                          <label className="field">
                            <span>count cap</span>
                            <input
                              type="number"
                              min="0"
                              max="8"
                              value={node.count}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'repeat'
                                    ? {
                                        ...current,
                                        count: clampInteger(Number(event.target.value), 0, 8),
                                      }
                                    : current,
                                )
                              }
                            />
                          </label>

                          <label className="toggle-field">
                            <input
                              type="checkbox"
                              checked={node.animated}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'repeat'
                                    ? { ...current, animated: event.target.checked }
                                    : current,
                                )
                              }
                            />
                            <span>animate from frame</span>
                          </label>
                        </div>
                      ) : null}

                      {node.type === 'progressBar' ? (
                        <div className="control-grid">
                          <label className="field">
                            <span>width</span>
                            <input
                              type="number"
                              min="4"
                              max="48"
                              value={node.width}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'progressBar'
                                    ? {
                                        ...current,
                                        width: clampInteger(Number(event.target.value), 4, 48),
                                      }
                                    : current,
                                )
                              }
                            />
                          </label>

                          <label className="field">
                            <span>filled</span>
                            <input
                              value={node.filled}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'progressBar'
                                    ? { ...current, filled: event.target.value || '=' }
                                    : current,
                                )
                              }
                            />
                          </label>

                          <label className="field">
                            <span>empty</span>
                            <input
                              value={node.empty}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'progressBar'
                                    ? { ...current, empty: event.target.value || '.' }
                                    : current,
                                )
                              }
                            />
                          </label>

                          <label className="toggle-field">
                            <input
                              type="checkbox"
                              checked={node.showCounter}
                              onChange={(event) =>
                                updateNode(line.id, node.id, (current) =>
                                  current.type === 'progressBar'
                                    ? { ...current, showCounter: event.target.checked }
                                    : current,
                                )
                              }
                            />
                            <span>show counter</span>
                          </label>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>

                <div className="inline-actions">
                  <button type="button" className="secondary-button" onClick={() => addNode(line.id, 'text')}>
                    + Text
                  </button>
                  <button type="button" className="secondary-button" onClick={() => addNode(line.id, 'repeat')}>
                    + Repeat
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addNode(line.id, 'progressBar')}
                  >
                    + Progress bar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="primary-button" onClick={addLine}>
            Add line
          </button>
        </section>

        <section className="panel preview-panel">
          <div className="section-header">
            <div>
              <p className="section-kicker">Preview</p>
              <h2>Terminal output</h2>
            </div>
            <p className="section-note">Single-line friendly, multiline ready.</p>
          </div>

          <div className="terminal-window">
            <div className="window-bar">
              <div className="window-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>{state.title}.preview</p>
            </div>
            <pre className="terminal-output">{previewText}</pre>
          </div>

          <div className="summary-card">
            <p className="section-kicker">Scene summary</p>
            <pre>{sceneSummary}</pre>
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
                  onClick={() => setExportTarget(target as PlaygroundState['exportTarget'])}
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
              onClick={async () => {
                if (await copyText(generatedCode)) {
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
            <textarea readOnly value={currentShareUrl} rows={3} />
          </label>
        </section>
      </main>
    </div>
  )
}