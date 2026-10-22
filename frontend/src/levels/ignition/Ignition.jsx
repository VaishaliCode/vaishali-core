import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'
import ReactorScene from './ReactorScene'
import { reactor, resetReactor } from './reactorState'
import { isTouch } from '../../components/pointerVerb'
import './ignition.css'

const BOOT_LINES = [
  '> mounting core modules ........ ok',
  '> calibrating plasma containment  ok',
  '> loading identity: VAISHALI.MULEY',
  '> status: dormant — manual ignition required',
]

const CIRC = 2 * Math.PI * 52

function statusFor(c) {
  if (c >= 0.95) return "Don't let go."
  if (c >= 0.7) return 'Containment straining'
  if (c >= 0.35) return 'Plasma rising'
  if (c > 0.02) return 'Charging core'
  return ''
}

export default function Ignition({ onComplete }) {
  const [phase, setPhase] = useState('boot') // boot → ready → igniting → done
  const [lines, setLines] = useState([])
  const phaseRef = useRef('boot')
  const tweenRef = useRef(null)
  const hudRef = useRef(null)
  const flashRef = useRef(null)
  const ringRef = useRef(null)
  const tempRef = useRef(null)
  const statusRef = useRef(null)
  const hexRef = useRef(null)
  const navigate = useNavigate()

  const go = (p) => {
    phaseRef.current = p
    setPhase(p)
  }

  const updateHud = useCallback(() => {
    const c = reactor.charge
    if (ringRef.current) ringRef.current.style.strokeDashoffset = CIRC * (1 - c)
    if (tempRef.current) tempRef.current.textContent = String(Math.round(c * 100)).padStart(3, '0')
    if (statusRef.current) statusRef.current.textContent = statusFor(c)
  }, [])

  // Boot: assemble the reactor + type the log
  useEffect(() => {
    resetReactor()
    const tl = gsap.timeline()
    tl.fromTo(hudRef.current, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.3)
    tl.to(reactor, { assemble: 1, duration: 3.8, ease: 'power2.inOut' }, 0.4)
    BOOT_LINES.forEach((line, i) =>
      tl.call(() => setLines((prev) => [...prev, line]), null, 0.6 + i * 0.75)
    )
    tl.call(() => go('ready'), null, 4.3)

    const hex = setInterval(() => {
      if (!hexRef.current) return
      hexRef.current.textContent = Array.from(
        { length: 3 },
        () => '0x' + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')
      ).join('  ')
    }, 140)

    return () => {
      tl.kill()
      clearInterval(hex)
      tweenRef.current?.kill()
    }
  }, [])

  const ignite = () => {
    go('igniting')
    tweenRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => {
        go('done')
        onComplete?.()
      },
    })
    tl.set(flashRef.current, { opacity: 0.85 })
      .to(flashRef.current, { opacity: 0, duration: 0.7, ease: 'power2.out' })
      .to(hudRef.current, { opacity: 0, duration: 0.5 }, 0)
      .to(reactor, { open: 1, duration: 2.6, ease: 'power2.out' }, 0.05)
      .to(reactor, { charge: 0.5, duration: 1.2 }, 0)
      .to(reactor, { dive: 1, duration: 2.3, ease: 'power2.in' }, 0.9)
      .to(flashRef.current, { opacity: 1, duration: 0.6, ease: 'power2.in' }, 2.6)
  }

  const startCharge = () => {
    if (phaseRef.current !== 'ready') return
    tweenRef.current?.kill()
    tweenRef.current = gsap.to(reactor, {
      charge: 1,
      duration: 2.8 * (1 - reactor.charge),
      ease: 'power1.in',
      onUpdate: updateHud,
      onComplete: ignite,
    })
  }

  const releaseCharge = () => {
    if (phaseRef.current !== 'ready') return
    tweenRef.current?.kill()
    tweenRef.current = gsap.to(reactor, {
      charge: 0,
      duration: 1.2 * reactor.charge,
      ease: 'power2.out',
      onUpdate: updateHud,
    })
  }

  // Space bar + releasing anywhere on screen
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        startCharge()
      }
    }
    const up = (e) => e.code === 'Space' && releaseCharge()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('pointerup', releaseCharge)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('pointerup', releaseCharge)
    }
  })

  return (
    <section className="ignition" onContextMenu={(e) => e.preventDefault()}>
      <div className="ignition__canvas">
        <ReactorScene />
      </div>

      <div className="hud" ref={hudRef}>
        <span className="corner corner--tl" />
        <span className="corner corner--tr" />
        <span className="corner corner--bl" />
        <span className="corner corner--br" />

        <div className="hud__top">
          <span className="mono">
            Vaishali<span className="hud__accent">//</span>Core
          </span>
          <span className="mono">Lvl 00 — Ignition</span>
        </div>

        <div className="hud__boot">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>

        <div className="hud__readout">
          <p className="mono">Core temp</p>
          <p className="hud__temp">
            <span ref={tempRef}>000</span>
            <small>%</small>
          </p>
          <p className="mono hud__hex" ref={hexRef} />
        </div>

        <div className={`ignite ${phase !== 'ready' ? 'is-disabled' : ''}`}>
          <button className="ignite__btn" onPointerDown={startCharge} onPointerLeave={releaseCharge} aria-label="Hold to ignite the reactor">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="ignite__track" />
              <circle
                ref={ringRef}
                cx="60"
                cy="60"
                r="52"
                className="ignite__progress"
                style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC }}
              />
            </svg>
            <span className="ignite__core" />
          </button>
          <p className={`mono ignite__label ${phase === 'ready' ? 'guide' : ''}`}>
            {phase === 'boot' ? 'Booting…' : isTouch ? 'Press & hold the core to ignite' : 'Press & hold to ignite'}
          </p>
          <p className="mono ignite__status" ref={statusRef} />
          <p className="mono ignite__hint">or hold the Space bar</p>
        </div>

        {/* Shortcut for recruiters: the whole résumé on one page, no animation */}
        {phase === 'ready' && (
          <div className="recruiter-cta">
            <button type="button" className="recruiter-cta__btn" onClick={() => navigate('/recruiter')}>
              <span className="mono recruiter-cta__tag">Short on time?</span>
              <span className="recruiter-cta__label">Recruiter view</span>
              <span className="mono recruiter-cta__sub">Skip the animation · full résumé on one page →</span>
            </button>
          </div>
        )}
      </div>

      <div className="flash" ref={flashRef} />
    </section>
  )
}