import {
  frameSketch,
  hero,
  metrics,
  openQuestions,
  phases,
  principles,
  repoSlices,
  repoTree,
  risks,
  stackChoices,
  terminalPreview,
} from './blueprint'

function App() {
  return (
    <div className="page">
      <header className="hero-grid">
        <section className="panel hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>{hero.title}</h1>
          <p className="lede">{hero.summary}</p>

          <div className="chip-row" aria-label="Project posture">
            {hero.chips.map((chip) => (
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>

          <div className="metric-grid">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <p className="metric-label">{metric.label}</p>
                <p className="metric-value">{metric.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel workbench-panel">
          <div className="window-bar">
            <div className="window-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Phase 1 target workbench</p>
          </div>

          <div className="workbench-grid">
            <section className="code-pane">
              <p className="pane-label">authoring contract</p>
              <pre>{frameSketch}</pre>
            </section>

            <section className="terminal-pane">
              <p className="pane-label">preview model</p>
              <pre>{terminalPreview}</pre>
              <div className="terminal-tags" aria-label="Planned controls">
                <span>time scrubber</span>
                <span>progress injector</span>
                <span>template presets</span>
              </div>
            </section>
          </div>
        </section>
      </header>

      <main className="content-grid">
        <section className="panel card">
          <div className="card-heading">
            <div>
              <p className="section-kicker">Foundation</p>
              <h2>Decisions to lock first</h2>
            </div>
          </div>

          <div className="stack-list">
            {principles.map((item) => (
              <article className="list-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel card">
          <div className="card-heading">
            <div>
              <p className="section-kicker">Libraries</p>
              <h2>Established tools to lean on</h2>
            </div>
          </div>

          <div className="stack-list">
            {stackChoices.map((choice) => (
              <article className="list-card" key={choice.name}>
                <div className="item-topline">
                  <h3>{choice.name}</h3>
                  <span className="badge">{choice.timing}</span>
                </div>
                <p>{choice.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel card card-wide">
          <div className="card-heading card-heading-split">
            <div>
              <p className="section-kicker">Repository</p>
              <h2>Planned slice map</h2>
            </div>
            <span className="badge subtle">Add folders when code lands</span>
          </div>

          <pre className="repo-tree">{repoTree}</pre>

          <div className="slice-grid">
            {repoSlices.map((slice) => (
              <article className="list-card" key={slice.path}>
                <h3>{slice.path}</h3>
                <p>{slice.purpose}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel card card-wide">
          <div className="card-heading">
            <div>
              <p className="section-kicker">Roadmap</p>
              <h2>Delivery phases</h2>
            </div>
          </div>

          <div className="phase-grid">
            {phases.map((phase) => (
              <article className="phase-card" key={phase.name}>
                <p className="phase-name">{phase.name}</p>
                <h3>{phase.goal}</h3>
                <p>{phase.exit}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel card">
          <div className="card-heading">
            <div>
              <p className="section-kicker">Risks</p>
              <h2>Things that can go sideways</h2>
            </div>
          </div>

          <div className="stack-list">
            {risks.map((risk) => (
              <article className="list-card" key={risk.title}>
                <h3>{risk.title}</h3>
                <p>{risk.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel card">
          <div className="card-heading">
            <div>
              <p className="section-kicker">Questions</p>
              <h2>Answers we still need</h2>
            </div>
          </div>

          <div className="stack-list">
            {openQuestions.map((item) => (
              <article className="list-card" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.why}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App