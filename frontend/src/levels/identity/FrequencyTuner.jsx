import { useEffect, useMemo, useRef, useState } from 'react'
import { signal } from './signalState'
import { isTouch } from '../../components/pointerVerb'

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

export default function FrequencyTuner({ locked, onLock }) {
  const target = useMemo(() => 0.58 + Math.random() * 0.27, []) // random every visit
  const [value, setValue] = useState(0.08)
  const trackRef = useRef(null)
  const scopeRef = useRef(null)
  const dragging = useRef(false)
  const lockedRef = useRef(false)

  const clarityOf = (v) => Math.pow(clamp01(1 - Math.abs(v - target) / 0.4), 1.6)

  const lock = () => {
    if (lockedRef.current) return
    lockedRef.current = true
    setValue(target)
    onLock()
  }

  const apply = (v) => {
    if (lockedRef.current) return
    const c = clarityOf(v)
    signal.clarity = c
    setValue(v)
    if (c > 0.97) lock()
  }

  const fromEvent = (e) => {
    const r = trackRef.current.getBoundingClientRect()
    return clamp01((e.clientX - r.left) / r.width)
  }

  // Live oscilloscope
  useEffect(() => {
    const cv = scopeRef.current
    const ctx = cv.getContext('2d')
    let raf
    const draw = (now) => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = cv.clientWidth
      const h = cv.clientHeight
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr)
        cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const c = signal.clarity
      const t = now / 1000
      ctx.beginPath()
      for (let x = 0; x <= w; x += 2) {
        const p = x / w
        const env = Math.sin(p * Math.PI)
        const clean = Math.sin(p * Math.PI * 8 + t * 4)
        const noise = (Math.random() - 0.5) * 2
        const y = h / 2 + env * h * 0.38 * (clean * c + noise * (1 - c) * 0.9)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      const color = c > 0.9 ? '#d6b77e' : `rgba(124,199,255,${0.5 + c * 0.5})`
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.lineWidth = 1.2
      ctx.stroke()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const freq = (88 + value * 20).toFixed(1)
  const pct = Math.round((locked ? 1 : clarityOf(value)) * 100)

  return (
    <div className={`tuner ${locked ? 'is-locked' : ''}`}>
      <div className="tuner__readout">
        <span className="mono">
          Freq <b>{freq} MHz</b>
        </span>
        <span className="mono">
          Signal <b>{pct}%</b>
        </span>
      </div>

      <canvas ref={scopeRef} className="tuner__scope" />

      <div
        ref={trackRef}
        className="tuner__track"
        data-cursor
        role="slider"
        tabIndex={0}
        aria-label="Tune the frequency"
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          apply(fromEvent(e))
        }}
        onPointerMove={(e) => dragging.current && apply(fromEvent(e))}
        onPointerUp={() => {
          dragging.current = false
          if (signal.clarity > 0.85) lock()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') apply(clamp01(value + 0.02))
          if (e.key === 'ArrowLeft') apply(clamp01(value - 0.02))
        }}
      >
        <div className="tuner__line" />
        <div className="tuner__knob" style={{ left: `${value * 100}%` }} />
      </div>

      {!locked && (
        <p className="tuner__hint">
          <span className="mono guide">
            {isTouch ? 'Slide the dial' : 'Drag the dial'} until the signal reaches 100%
          </span>
        </p>
      )}
    </div>
  )
}