import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import useCertificates from './useCertificates'
import VaultScene, { setCursorHover } from './VaultScene'
import { vault, resetVault } from './vaultState'
import DecodeText from '../../components/DecodeText'
import './honors.css'

const pad = (n) => String(n).padStart(2, '0')
const cipher = (s = '') => s.replace(/\S/g, '▒')

// "2024-05-12" → "May 2024" (returns null when there is no date)
const formatDate = (iso) => {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// Decorative seal code built from the certificate's text: the same certificate always gets the same code
const sealCode = (c) => {
  let h = 2166136261
  for (const ch of `${c.title}|${c.issuer}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6)
  return `HV-${String(c.id ?? 0).padStart(3, '0')}-${hex}`
}

export default function Honors({ onComplete }) {
  const { certificates, status } = useCertificates()
  const count = certificates.length
  const [focus, setFocus] = useState(0) // capsule at the front of the vault
  const [opened, setOpened] = useState([]) // indexes of opened capsules
  const [busy, setBusy] = useState(false) // a capsule is unsealing
  const [online, setOnline] = useState(false) // every capsule open
  const lock = useRef(false) // blocks input while unsealing (state updates are too slow for this)
  const turnTarget = useRef(0)
  const timeline = useRef(null)
  const actions = useRef({})

  // One small animation object per capsule. GSAP tweens `open`, the scene reads it every frame.
  const capsules = useMemo(() => certificates.map(() => ({ open: 0 })), [certificates])

  // Lock scrolling and reset the 3D values when the level opens
  useEffect(() => {
    resetVault()
    window.lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    window.lenis?.stop()
    return () => {
      timeline.current?.kill()
      gsap.killTweensOf(vault)
      setCursorHover(false)
      window.lenis?.start()
    }
  }, [])

  // Rotate the carousel the short way round until capsule `index` faces the camera
  const goTo = (index) => {
    if (lock.current || index === focus || count === 0) return
    let delta = (((index - focus) % count) + count) % count
    if (delta > count / 2) delta -= count
    turnTarget.current -= delta * ((Math.PI * 2) / count)
    gsap.to(vault, { turn: turnTarget.current, duration: 1.3, ease: 'power3.inOut', overwrite: 'auto' })
    setFocus(index)
  }
  const step = (dir) => goTo((focus + dir + count) % count)

  // Release the locks, split the capsule, then show the certificate
  const unseal = () => {
    if (lock.current || count === 0 || opened.includes(focus)) return
    lock.current = true
    setBusy(true)
    const index = focus
    const done = opened.length + 1

    timeline.current = gsap.timeline()
      .fromTo(vault, { unseal: 0 }, { unseal: 1, duration: 1.7, ease: 'power2.inOut' })
      .to(capsules[index], { open: 1, duration: 1.6, ease: 'power3.inOut' }, '-=0.4')
      .to(vault, { energy: done / count, duration: 1.2, ease: 'power2.out' }, '<')
      .call(() => setOpened((prev) => [...prev, index]), null, '-=0.8')
      .set(vault, { unseal: 0 })
      .call(() => {
        lock.current = false
        setBusy(false)
      })
  }

  // Keyboard: ← → rotate, Enter unseals (buttons and links keep their own Enter)
  useEffect(() => {
    actions.current = { step, unseal }
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') actions.current.step(1)
      else if (e.key === 'ArrowLeft') actions.current.step(-1)
      else if (e.key === 'Enter' && !e.target.closest?.('button, a')) actions.current.unseal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Every capsule open: let the last one settle, then the vault surges
  useEffect(() => {
    if (count === 0 || opened.length !== count) return
    const timer = setTimeout(() => {
      setOnline(true)
      gsap.timeline()
        .to(vault, { surge: 1, duration: 0.6, ease: 'power3.in' })
        .to(vault, { surge: 0.2, duration: 2.4, ease: 'power2.out' })
    }, 1200)
    return () => clearTimeout(timer)
  }, [opened.length, count])

  if (status !== 'ready' || count === 0) {
    return (
      <section className="honors honors--empty">
        <p className="mono">
          {status === 'loading' ? 'Opening the vault…'
            : status === 'error' ? 'Vault offline. Is the backend running?'
            : 'The vault is empty. Honors are being minted.'}
        </p>
      </section>
    )
  }

  const cert = certificates[focus]
  const isOpen = opened.includes(focus)
  const sealedLeft = count - opened.length
  const issued = formatDate(cert.issuedOn)

  return (
    <section className={`honors ${online ? 'is-online' : ''}`}>
      <div className="honors__canvas">
        <VaultScene capsules={capsules} focus={focus} onSelect={goTo} onUnseal={unseal} />
      </div>

      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <span className="corner corner--bl" />
      <span className="corner corner--br" />

      <header className="honors__top">
        <span className="mono">
          Vaishali<span className="hud__accent">//</span>Core
        </span>
        <span className="mono">Lvl 04 — Honors Vault</span>
      </header>

      {/* ---------- Top left: vault status, then the gate ---------- */}
      <div className="honors__status">
        <p className="mono honors__status-line">
          {online ? '◆ Vault open · all honors verified' : `◇ ${pad(sealedLeft)} sealed capsule${sealedLeft === 1 ? '' : 's'}`}
        </p>

        {online && (
          <div className="honors__gate">
            <span className="honors__gate-lock">⬡</span>
            <p className="mono">Level 05 · Transmission</p>
            {onComplete ? (
              <>
                <p className="honors__gate-title">Uplink ready.</p>
                <button type="button" className="mono honors__gate-btn" onClick={onComplete}>
                  Open Transmission →
                </button>
              </>
            ) : (
              <p className="honors__gate-title">Sealed — awaiting next build.</p>
            )}
          </div>
        )}
      </div>

      {/* ---------- Bottom: carousel controls ---------- */}
      <div className="honors__dial">
        <button type="button" className="honors__arrow" onClick={() => step(-1)} disabled={busy} aria-label="Previous capsule">←</button>
        <div className="honors__dial-mid">
          <div className="honors__pips">
            {certificates.map((c, i) => (
              <button key={c.id} type="button" aria-label={`Capsule ${i + 1}`} onClick={() => goTo(i)} disabled={busy}
                className={`honors__pip ${i === focus ? 'is-active' : ''} ${opened.includes(i) ? 'is-open' : ''}`} />
            ))}
          </div>
          <p className="mono honors__count">Capsule {pad(focus + 1)} / {pad(count)}</p>
          <p className="mono honors__keys">← → rotate · Enter unseal</p>
        </div>
        <button type="button" className="honors__arrow" onClick={() => step(1)} disabled={busy} aria-label="Next capsule">→</button>
      </div>

      {/* ---------- Right: certificate plaque ---------- */}
      <article className={`plaque ${isOpen ? 'is-open' : ''}`} key={`${focus}-${isOpen ? 'open' : busy ? 'busy' : 'sealed'}`} data-lenis-prevent>
        <span className="plaque__emblem" aria-hidden="true">⬡</span>

        {isOpen ? (
          <>
            <p className="mono plaque__code">
              Capsule {pad(focus + 1)} · <span className="plaque__verified">Verified ✓</span>
            </p>
            <DecodeText as="h2" className="plaque__title" text={cert.title} start />
            <p className="plaque__issuer">{cert.issuer}</p>

            {cert.imageUrl && (
              <figure className="plaque__image">
                <img src={cert.imageUrl} alt={`${cert.title} certificate`} loading="lazy" />
              </figure>
            )}

            <dl className="plaque__meta">
              {issued && (
                <div>
                  <dt className="mono">Issued</dt>
                  <dd>{issued}</dd>
                </div>
              )}
              <div>
                <dt className="mono">Vault seal</dt>
                <dd className="mono">{sealCode(cert)}</dd>
              </div>
              <div>
                <dt className="mono">Status</dt>
                <dd>Authenticated</dd>
              </div>
            </dl>

            <div className="plaque__links">
              {cert.credentialUrl ? (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="mono">Verify credential ↗</a>
              ) : (
                <span className="mono plaque__soon">Credential link · on request</span>
              )}
            </div>
          </>
        ) : busy ? (
          <div className="plaque__sealed">
            <p className="mono plaque__code">Capsule {pad(focus + 1)} · Unsealing</p>
            <ul className="mono plaque__sequence">
              <li>Verifying issuer signature…</li>
              <li>Releasing magnetic locks…</li>
              <li>Pressure equalised · opening</li>
            </ul>
            <div className="plaque__bar"><i /></div>
          </div>
        ) : (
          <div className="plaque__sealed">
            <p className="mono plaque__code">Capsule {pad(focus + 1)} · Sealed</p>
            <p className="plaque__cipher">{cipher(cert.title)}</p>
            <p className="mono plaque__redacted">Issuer · {cipher(cert.issuer)}</p>
            <button type="button" className="mono plaque__unseal" onClick={unseal}>
              <span className="plaque__unseal-ring" />
              Unseal capsule
            </button>
            <p className="mono plaque__hint">Or click the capsule in the vault</p>
          </div>
        )}
      </article>
    </section>
  )
}