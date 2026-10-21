import { useEffect, useState } from 'react'
import { VIBE_STAGES } from './vibeDemo'

// Widths of the blacked-out "lines" — they hint at code without showing any.
const REDACTED = [62, 38, 74, 0, 46, 81, 55, 30, 0, 68, 42, 0, 57]

export default function VibeTerminal() {
  const [pulse, setPulse] = useState(0) // which pipeline stage is glowing

  // A signal keeps running through the pipeline: the build is alive, just not public yet
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % (VIBE_STAGES.length + 1)), 650)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="vibe">
      <div className="vibe__bar">
        <span className="vibe__dots"><i /><i /><i /></span>
        <span className="mono">vibelang · interpreter</span>
        <span className="mono vibe__badge"><i /> Build in progress</span>
      </div>

      <div className="vibe__redacted" aria-hidden="true">
        {REDACTED.map((w, i) => (
          <div key={i} className="vibe__line">
            <span className="vibe__ln">{String(i + 1).padStart(2, '0')}</span>
            {w > 0 && <span className="vibe__bar-redact" style={{ width: `${w}%` }} />}
          </div>
        ))}
        <p className="vibe__stamp mono">Classified · still compiling</p>
      </div>

      <div className="vibe__stages">
        {VIBE_STAGES.map((s, i) => (
          <span key={s} className={`mono ${i === pulse ? 'is-on' : ''}`}>
            {s}
            {i < VIBE_STAGES.length - 1 && <em>→</em>}
          </span>
        ))}
      </div>

      <p className="vibe__note">The source and a live playground unlock when VibeLang is released.</p>
    </div>
  )
}
