import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import useLinks from './useLinks'
import useTerminal from './useTerminal'
import TransmissionScene from './TransmissionScene'
import { transmission, resetTransmission } from './transmissionState'
import './transmission.css'

const pad = (n) => String(n).padStart(2, '0')
const isMail = (url) => url.startsWith('mailto:')
const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
// "https://www.linkedin.com/in/x/" → "linkedin.com/in/x" · "mailto:a@b.com" → "a@b.com"
const display = (url) => url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const BOOT = [
  { kind: 'sys', text: 'VAISHALI//CORE · uplink terminal v5.0', wait: 400 },
  { kind: 'sys', text: 'Reactor stable · systems docked · archive decrypted · vault open' },
  { kind: 'cmd', text: 'uplink --status', wait: 500 },
  { kind: 'warn', text: 'Uplink offline · dish not aligned', wait: 400 },
]

const PREFIX = { cmd: '$ ', ok: '✓ ', warn: '! ', out: '  ', sys: '' }

export default function Transmission({ onRestart }) {
  const { links } = useLinks()
  const { log, print } = useTerminal()
  const [phase, setPhase] = useState('boot') // boot → ready → linking → online
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const logRef = useRef(null)
  const timeline = useRef(null)
  const started = useRef(false)

  const online = phase === 'online'
  const email = links.find((l) => isMail(l.url))
  const address = email ? display(email.url) : null

  // Lock scrolling and reset the 3D values when the level opens
  useEffect(() => {
    resetTransmission()
    window.lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    window.lenis?.stop()
    return () => {
      timeline.current?.kill()
      gsap.killTweensOf(transmission)
      window.lenis?.start()
    }
  }, [])

  // Boot log, once
  useEffect(() => {
    if (started.current) return
    started.current = true
    print(BOOT).then(() => setPhase('ready'))
  }, [print])

  // Keep the newest terminal line in view
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  // A short burst of light up the beam
  const pulse = () => {
    gsap.timeline()
      .to(transmission, { pulse: 1, duration: 0.25, ease: 'power3.out', overwrite: 'auto' })
      .to(transmission, { pulse: 0, duration: 1.4, ease: 'power2.out' })
  }

  // Lock the dish, fire the beam, open the channels
  const establish = () => {
    if (phase !== 'ready') return
    setPhase('linking')
    print([
      { kind: 'cmd', text: 'uplink --open' },
      { kind: 'out', text: 'Aligning dish · azimuth locked', wait: 500 },
      { kind: 'out', text: 'Beam ignition…', wait: 600 },
      { kind: 'ok', text: 'Uplink established · channels open', wait: 700 },
    ])
    timeline.current = gsap.timeline()
      .to(transmission, { lock: 1, duration: 1.8, ease: 'power3.inOut' }, 0.4)
      .to(transmission, { beam: 1, duration: 1.2, ease: 'power2.out' }, 2.0)
      .to(transmission, { surge: 1, duration: 0.4, ease: 'power3.in' }, 2.0)
      .to(transmission, { surge: 0.25, duration: 2.2, ease: 'power2.out' }, 2.4)
      .call(() => setPhase('online'), null, 3.0)
  }

  const transmitLink = (link) => {
    print([
      { kind: 'cmd', text: `transmit --channel ${slug(link.label)}` },
      { kind: 'ok', text: `→ ${display(link.url)}` },
    ])
    pulse()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      print([{ kind: 'ok', text: 'Address copied to clipboard' }])
    } catch {
      print([{ kind: 'warn', text: `Clipboard blocked · address: ${address}` }])
    }
  }

  // Opens the visitor's own mail app with the message filled in (nothing is stored anywhere)
  const send = (e) => {
    e.preventDefault()
    if (!email || !message.trim()) return
    const who = name.trim()
    const subject = `Portfolio transmission from ${who || 'a visitor'}`
    const body = `${message.trim()}\n\n— ${who || 'Sent from VAISHALI//CORE'}`
    const sep = email.url.includes('?') ? '&' : '?'
    print([
      { kind: 'cmd', text: 'transmit --message' },
      { kind: 'ok', text: 'Opening your mail app…' },
    ])
    pulse()
    window.location.href = `${email.url}${sep}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const last = log[log.length - 1]
  const idle = phase === 'ready' || online

  return (
    <section className={`transmission ${online ? 'is-online' : ''}`}>
      <div className="transmission__canvas">
        <TransmissionScene />
      </div>

      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <span className="corner corner--bl" />
      <span className="corner corner--br" />

      <header className="transmission__top">
        <span className="mono">
          Vaishali<span className="hud__accent">//</span>Core
        </span>
        <span className="mono">Lvl 05 — Transmission</span>
      </header>

      {/* ---------- Top left: status, then the finale ---------- */}
      <div className="tx__status">
        <p className="mono tx__status-line">{online ? '◆ Uplink live · channels open' : '◇ Uplink offline'}</p>

        {online && (
          <div className="tx__finale">
            <span className="tx__finale-mark">⬡</span>
            <p className="mono">End of sequence</p>
            <p className="tx__finale-title">Core at full power.</p>
            <p className="tx__finale-note">Thank you for bringing it online.</p>
            {onRestart && (
              <button type="button" className="mono tx__restart" onClick={onRestart}>
                ↺ Restart sequence
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- Right: the uplink terminal ---------- */}
      <article className={`terminal ${online ? 'is-online' : ''}`} data-lenis-prevent>
        <div className="terminal__bar">
          <span className="terminal__dots"><i /><i /><i /></span>
          <span className="mono">uplink — tty05</span>
          <span className={`mono terminal__badge ${online ? 'is-live' : ''}`}>
            <i />
            {online ? 'Live' : phase === 'linking' ? 'Linking' : 'Offline'}
          </span>
        </div>

        <div className="terminal__log" ref={logRef}>
          {log.map((line, i) => (
            <p key={i} className={`terminal__line terminal__line--${line.kind}`}>
              {PREFIX[line.kind]}
              {line.text}
              {!idle && line === last && line.kind === 'cmd' && <span className="terminal__caret" />}
            </p>
          ))}
          {idle && (
            <p className="terminal__line terminal__line--cmd">
              {PREFIX.cmd}
              <span className="terminal__caret" />
            </p>
          )}
        </div>

        {phase === 'ready' && (
          <div className="terminal__action">
            <button type="button" className="mono terminal__uplink" onClick={establish}>
              <span className="terminal__uplink-dot" />
              Establish uplink
            </button>
            <p className="mono terminal__hint">Aligns the dish and opens the channels</p>
          </div>
        )}

        {online && (
          <>
            <p className="mono terminal__label">Open channels</p>
            <ul className="channels">
              {links.map((link, i) => {
                const mail = isMail(link.url)
                return (
                  <li key={link.id ?? link.label} className="channel" style={{ animationDelay: `${i * 0.12}s` }}>
                    <a className="channel__open" href={link.url} target={mail ? undefined : '_blank'} rel="noreferrer"
                      onClick={() => transmitLink(link)}>
                      <span className="mono channel__idx">{pad(i + 1)}</span>
                      <span className="channel__label">{link.label}</span>
                      <span className="mono channel__addr">{display(link.url)}</span>
                      <span className="channel__arrow">↗</span>
                    </a>
                    {mail && (
                      <button type="button" className="mono channel__copy" onClick={copy}>
                        {copied ? 'Copied ✓' : 'Copy'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            {email && (
              <form className="compose" onSubmit={send}>
                <p className="mono terminal__label">Compose transmission</p>
                <label className="compose__field">
                  <span className="mono">Your name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
                    placeholder="Optional" autoComplete="name" />
                </label>
                <label className="compose__field">
                  <span className="mono">Message</span>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1500}
                    placeholder="Say hello, share a role, or tell me what you thought of the core." required />
                </label>
                <div className="compose__row">
                  <button type="submit" className="mono compose__send" disabled={!message.trim()}>
                    Transmit message ↗
                  </button>
                  <p className="mono compose__note">Opens in your mail app</p>
                </div>
              </form>
            )}
          </>
        )}
      </article>
    </section>
  )
}