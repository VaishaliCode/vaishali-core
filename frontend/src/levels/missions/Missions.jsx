import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import useProjects from './useProjects'
import MissionScene from './MissionScene'
import VibeTerminal from './VibeTerminal'
import { mission, resetMission } from './missionState'
import { tapWord, tapLower, isTouch } from '../../components/pointerVerb'
import DecodeText from '../../components/DecodeText'
import './missions.css'

const pad = (n) => String(n).padStart(2, '0')
const isVibeLang = (p) => p.title.toLowerCase().includes('vibe')

// Shows a link only when it is set and isn't just the GitHub profile placeholder
const realRepo = (url) => url && !/github\.com\/[^/]+\/?$/.test(url)

export default function Missions({ onComplete }) {
  const { projects, status } = useProjects()
  const [decrypted, setDecrypted] = useState([]) // indexes of opened files
  const [active, setActive] = useState(null) // file shown in the viewer
  const [decrypting, setDecrypting] = useState(null) // file currently being decrypted
  const [online, setOnline] = useState(false) // every file decrypted
  const tween = useRef(null)

  useEffect(() => {
    resetMission()
    window.lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    window.lenis?.stop()
    return () => {
      tween.current?.kill()
      window.lenis?.start()
    }
  }, [])

  const open = (index) => {
    if (decrypting !== null) return // one decrypt at a time
    setActive(index)
    if (decrypted.includes(index)) return

    setDecrypting(index)
    const done = decrypted.length + 1
    tween.current = gsap.timeline()
      .fromTo(mission, { scan: 0 }, { scan: 1, duration: 1.8, ease: 'power2.inOut' })
      .to(mission, { energy: done / projects.length, duration: 0.8, ease: 'power2.out' }, '-=0.4')
      .call(() => {
        setDecrypted((prev) => [...prev, index])
        setDecrypting(null)
      })
  }

  // Every file open: wait a moment, then unlock the archive
  useEffect(() => {
    if (projects.length === 0 || decrypted.length !== projects.length) return
    const timer = setTimeout(() => {
      setOnline(true)
      gsap.timeline()
        .to(mission, { surge: 1, duration: 0.5, ease: 'power3.in' })
        .to(mission, { surge: 0.15, duration: 2.2, ease: 'power2.out' })
    }, 900)
    return () => clearTimeout(timer)
  }, [decrypted.length, projects.length])

  if (status !== 'ready') {
    return (
      <section className="missions missions--empty">
        <p className="mono">
          {status === 'loading' ? 'Opening the archive…' : 'Archive offline. Is the backend running?'}
        </p>
      </section>
    )
  }

  const current = active !== null ? projects[active] : null
  const isOpen = current && decrypted.includes(active)

  return (
    <section className={`missions ${online ? 'is-online' : ''}`}>
      <div className="missions__canvas">
        <MissionScene shape={active ?? 0} />
      </div>

      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <span className="corner corner--bl" />
      <span className="corner corner--br" />

      <header className="missions__top">
        <span className="mono">
          Vaishali<span className="hud__accent">//</span>Core
        </span>
        <span className="mono">Lvl 03 — Mission Archive</span>
      </header>

      {/* ---------- Left: the list of mission files ---------- */}
      <nav className="missions__list" aria-label="Mission files">
        <p className="mono missions__status">
          {online ? '◆ Archive unlocked' : `◇ ${pad(projects.length - decrypted.length)} encrypted file${projects.length - decrypted.length === 1 ? '' : 's'}${decrypted.length ? ' left · decrypt to continue' : ''}`}
        </p>
        {projects.map((p, i) => {
          const opened = decrypted.includes(i)
          return (
            <button type="button" key={p.id} onClick={() => open(i)}
              className={`file ${active === i ? 'is-active' : ''} ${opened ? 'is-open' : ''} ${decrypting === i ? 'is-busy' : ''}`}>
              <span className="mono file__code">Mission {pad(i + 1)}</span>
              <span className="file__title">{opened ? p.title : p.title.replace(/\S/g, '▒')}</span>
              <span className="mono file__state">
                {decrypting === i ? 'Decrypting…' : opened ? 'Decrypted' : `Encrypted · ${tapLower} to decrypt`}
              </span>
            </button>
          )
        })}

        {online && (
          <div className="missions__gate">
            <span className="missions__gate-lock">⬡</span>
            <p className="mono">Level 04 · Honors Vault</p>
            <p className="missions__gate-title">Honors vault detected.</p>
            <button type="button" className="mono missions__gate-btn" onClick={onComplete}>
              Enter Honors Vault →
            </button>
          </div>
        )}
      </nav>

      {/* ---------- Right: the file viewer ---------- */}
      {current && (
        <article className="dossier-file" key={`${active}-${isOpen}`} data-lenis-prevent>
          {!isOpen ? (
            <div className="dossier-file__locked">
              <p className="mono">Mission {pad(active + 1)} · decrypting</p>
              <div className="dossier-file__bar"><i /></div>
              <p className="dossier-file__cipher">{'▒'.repeat(24)}</p>
            </div>
          ) : (
            <>
              <p className="mono dossier-file__code">
                Mission {pad(active + 1)}{current.featured ? ' · Featured' : ''}
              </p>
              <DecodeText as="h2" className="dossier-file__title" text={current.title} start />
              {current.tagline && <p className="dossier-file__tagline">{current.tagline}</p>}

              {current.techStack?.length > 0 && (
                <ul className="dossier-file__tech">
                  {current.techStack.map((t) => <li key={t} className="mono">{t}</li>)}
                </ul>
              )}

              {current.description && <p className="dossier-file__desc">{current.description}</p>}

              {current.highlights?.length > 0 && (
                <>
                  <p className="mono dossier-file__label">Mission log</p>
                  <ol className="dossier-file__log">
                    {current.highlights.map((h, i) => (
                      <li key={i}>
                        <span className="mono">{pad(i + 1)}</span>
                        <p>{h}</p>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {isVibeLang(current) && (
                <>
                  <p className="mono dossier-file__label">Interpreter status</p>
                  <VibeTerminal />
                </>
              )}

              <div className="dossier-file__links">
                {realRepo(current.githubUrl) ? (
                  <a href={current.githubUrl} target="_blank" rel="noreferrer" className="mono">View source ↗</a>
                ) : (
                  <span className="mono dossier-file__soon">Source · releasing soon</span>
                )}
                {current.liveUrl && (
                  <a href={current.liveUrl} target="_blank" rel="noreferrer" className="mono">Live demo ↗</a>
                )}
              </div>
            </>
          )}
        </article>
      )}

      {!current && (
        <p className="missions__hint">
          <span className="mono guide">
            {tapWord} a mission file {isTouch ? 'above' : 'on the left'} to decrypt it
          </span>
        </p>
      )}
    </section>
  )
}
