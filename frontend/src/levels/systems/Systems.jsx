import { useCallback, useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import useSkills from './useSkills'
import SystemsScene from './SystemsScene'
import { systems, resetSystems } from './systemsState'
import DecodeText from '../../components/DecodeText'
import './systems.css'

// Friendly names for the categories stored in the database
const LABELS = {
  LANGUAGE: 'Languages',
  FRAMEWORK: 'Frameworks',
  DATABASE: 'Databases',
  TOOL: 'Tooling',
  CORE: 'Core CS',
  CONCEPT: 'Concepts',
  FRONTEND: 'Frontend',
}

const pad = (n) => String(n).padStart(2, '0')

export default function Systems() {
  const { groups, status } = useSkills()
  const [docked, setDocked] = useState([]) // indexes of docked cells
  const [active, setActive] = useState(null) // index shown in the side panel
  const [online, setOnline] = useState(false) // every cell docked

  // One small animation object per cell. GSAP tweens `dock`, the scene reads it every frame.
  const cellStates = useMemo(() => groups.map(() => ({ dock: 0, hover: 0, hoverEase: 0 })), [groups])

  // Lock scrolling and reset the 3D values when the level opens
  useEffect(() => {
    resetSystems()
    window.lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    window.lenis?.stop()
    return () => window.lenis?.start()
  }, [])

  const dock = useCallback(
    (index) => {
      setActive(index)
      if (docked.includes(index)) return // already docked: just show its skills again

      const count = docked.length + 1
      gsap.to(cellStates[index], { dock: 1, duration: 1.5, ease: 'power2.inOut' })
      gsap.to(systems, { power: count / groups.length, duration: 1.4, ease: 'power2.out' })
      setDocked((prev) => [...prev, index])
    },
    [docked, cellStates, groups.length],
  )

  // When the last cell docks: wait for it to land, then surge
  useEffect(() => {
    if (groups.length === 0 || docked.length !== groups.length) return
    const timer = setTimeout(() => {
      setOnline(true)
      gsap.timeline()
        .to(systems, { surge: 1, duration: 0.5, ease: 'power3.in' })
        .to(systems, { surge: 0.25, duration: 2.4, ease: 'power2.out' })
    }, 1600)
    return () => clearTimeout(timer)
  }, [docked.length, groups.length])

  if (status !== 'ready') {
    return (
      <section className="systems systems--empty">
        <p className="mono">
          {status === 'loading' ? 'Scanning systems…' : 'Systems offline. Is the backend running?'}
        </p>
      </section>
    )
  }

  const current = active !== null ? groups[active] : null

  return (
    <section className={`systems ${online ? 'is-online' : ''}`}>
      <div className="systems__canvas">
        <SystemsScene groups={groups} cellStates={cellStates} labels={LABELS} onDock={dock} />
      </div>

      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <span className="corner corner--bl" />
      <span className="corner corner--br" />

      <header className="systems__top">
        <span className="mono">
          Vaishali<span className="hud__accent">//</span>Core
        </span>
        <span className="mono">Lvl 02 — Systems Bay</span>
      </header>

      <p className="mono systems__status">
        {online ? '◆ All systems online' : '◇ Power cells offline — click each cell to dock it'}
      </p>

      {/* Progress: one tick per cell */}
      <div className="systems__progress">
        <p className="mono">
          Cells docked <b>{pad(docked.length)}</b> / {pad(groups.length)}
        </p>
        <div className="systems__ticks">
          {groups.map((g, i) => (
            <i key={g.category} className={docked.includes(i) ? 'is-on' : ''} />
          ))}
        </div>
      </div>

      {/* Side panel: the skills inside the selected cell */}
      {current && (
        <aside className="systems__panel" key={current.category}>
          <p className="mono">
            Cell {pad(active + 1)} · {pad(current.skills.length)} module{current.skills.length === 1 ? '' : 's'}
          </p>
          <h2 className="systems__panel-title">{LABELS[current.category] ?? current.category}</h2>
          <ul>
            {current.skills.map((skill, i) => (
              <li key={skill.id}>
                <span className="mono">{pad(i + 1)}</span>
                <DecodeText text={skill.name} start delay={0.15 + i * 0.08} />
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Gate to the next level */}
      {online && (
        <div className="systems__gate">
          <span className="systems__gate-lock">⬡</span>
          <p className="mono">Level 03 · Mission Archive</p>
          <p className="systems__gate-title">Sealed — awaiting next build.</p>
        </div>
      )}
    </section>
  )
}