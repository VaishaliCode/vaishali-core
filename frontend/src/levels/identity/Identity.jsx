import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import SignalParticles from './SignalParticles'
import FrequencyTuner from './FrequencyTuner'
import DecodeText from '../../components/DecodeText'
import { signal } from './signalState'
import { profile } from '../../data/profile'
import './identity.css'

gsap.registerPlugin(useGSAP)

// "*word*" → gold italic
const parseAccents = (str) =>
  str.split(' ').map((w) => ({ text: w.replace(/\*/g, ''), accent: w.startsWith('*') }))

function Dossier({ onComplete }) {
  const root = useRef(null)
  const words = parseAccents(profile.statement)
  const meLine = parseAccents(profile.meme.meLine)

  useGSAP(
    () => {
      gsap.from('.statement .word > span', {
        yPercent: 115,
        duration: 1.3,
        ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: { trigger: '.statement', start: 'top 80%' },
      })

      gsap.from('.dossier__line', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1.8,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: '.dossier__line', start: 'top 90%' },
      })

      gsap.utils.toArray('.reveal').forEach((el) =>
        gsap.from(el, {
          y: 60,
          opacity: 0,
          filter: 'blur(10px)',
          duration: 1.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      )

      gsap.utils.toArray('[data-count]').forEach((el) => {
        const counter = { v: 0 }
        gsap.to(counter, {
          v: Number(el.dataset.count),
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          onUpdate: () => (el.textContent = Math.round(counter.v)),
        })
      })
    },
    { scope: root }
  )

  return (
    <div className="dossier" id="dossier" ref={root}>
      <div className="dossier__head">
        <span className="mono">◆ Dossier decoded</span>
        <span className="mono">File 01 / 05</span>
      </div>

      <h2 className="statement">
        {words.map((w, i) => (
          <span className="word" key={i}>
            <span className={w.accent ? 'accent' : ''}>{w.text}</span>
          </span>
        ))}
      </h2>

      <div className="dossier__line" />

      <div className="dossier__grid">
        <dl className="facts">
          {profile.facts.map((f) => (
            <div className="fact reveal" key={f.label}>
              <dt className="mono">{f.label}</dt>
              <dd>
                <DecodeText text={f.value} />
              </dd>
            </div>
          ))}
          <div className="fact reveal">
            <dt className="mono">Channels</dt>
            <dd className="channels">
              {profile.links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
                  {l.label} <span>↗</span>
                </a>
              ))}
            </dd>
          </div>
        </dl>

        <div className="dossier__right">
          <p className="summary reveal">{profile.summary}</p>

          <div className="stats">
            {profile.stats.map((s) => (
              <div className="stat reveal" key={s.label}>
                <p className="stat__value">
                  <span data-count={s.value}>0</span>
                  <span className="stat__suffix">{s.suffix}</span>
                </p>
                <p className="mono">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="meme reveal">
            <p className="mono meme__tag">◇ {profile.meme.tag}</p>
            <div className="meme__row">
              <span className="mono meme__who">{profile.meme.them}</span>
              <p>“{profile.meme.themLine}”</p>
            </div>
            <div className="meme__row meme__row--me">
              <span className="mono meme__who">{profile.meme.me}</span>
              <p>
                “
                {meLine.map((w, i) => (
                  <span key={i}>
                    {w.accent ? <em>{w.text}</em> : w.text}
                    {i < meLine.length - 1 ? ' ' : ''}
                  </span>
                ))}
                ”
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="gate reveal">
        <span className="gate__lock">⬡</span>
        <p className="mono">Level 02 · Systems Bay</p>
        <p className="gate__title">Power cells detected.</p>
        <button type="button" className="mono gate__btn" onClick={onComplete}>
          Enter Systems Bay →
        </button>
      </div>
    </div>
  )
}

export default function Identity({ onComplete }) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    signal.clarity = 0
    window.scrollTo(0, 0)
    window.lenis?.stop()
    return () => window.lenis?.start()
  }, [])

  const handleLock = () => {
    setLocked(true)
    gsap.to(signal, { clarity: 1, duration: 1, ease: 'power2.out' })
    setTimeout(() => {
      window.lenis?.start()
      window.lenis?.scrollTo('#dossier', { duration: 2.4 })
    }, 2200)
  }

  return (
    <section className="identity">
      <div className="identity__stage">
        <div className="identity__canvas">
          <SignalParticles />
        </div>

        <span className="corner corner--tl" />
        <span className="corner corner--tr" />
        <span className="corner corner--bl" />
        <span className="corner corner--br" />

        <div className="identity__top">
          <span className="mono">
            Vaishali<span className="hud__accent">//</span>Core
          </span>
          <span className="mono">Lvl 01 — Identity Signal</span>
        </div>

        <p className={`mono identity__status ${locked ? 'is-locked' : ''}`}>
          {locked ? '◆ Signal locked' : '◇ Incoming transmission — source unknown'}
        </p>

        <div className="identity__role">
          <DecodeText text={`${profile.role}  ·  ${profile.location}`} start={locked} delay={0.4} className="mono" />
        </div>

        <FrequencyTuner locked={locked} onLock={handleLock} />

        {locked && <p className="mono identity__cue">Decoding dossier ↓</p>}
      </div>

      {locked && <Dossier onComplete={onComplete} />}
    </section>
  )
}