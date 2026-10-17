import { useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEF0123456789'

/**
 * Text that decrypts itself letter by letter.
 * - No `start` prop: starts automatically when scrolled into view.
 * - `start={true/false}`: you control when it starts.
 */
export default function DecodeText({ text, as: Tag = 'span', className, delay = 0, speed = 1, start }) {
  const ref = useRef(null)
  const [out, setOut] = useState(() => text.replace(/\S/g, '\u00A0'))

  useEffect(() => {
    let raf
    let triggered = false

    const run = () => {
      const begin = performance.now() + delay * 1000
      const tick = (now) => {
        const elapsed = Math.max(0, now - begin)
        const revealed = Math.floor(elapsed / (26 / speed))
        let s = ''
        for (let i = 0; i < text.length; i++) {
          const ch = text[i]
          if (ch === ' ') s += ' '
          else if (i < revealed) s += ch
          else if (elapsed > 0 && i < revealed + 6) s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          else s += '\u00A0'
        }
        setOut(s)
        if (revealed < text.length) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    if (start === undefined) {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !triggered) {
            triggered = true
            run()
            io.disconnect()
          }
        },
        { threshold: 0.4 }
      )
      io.observe(ref.current)
      return () => {
        io.disconnect()
        cancelAnimationFrame(raf)
      }
    }

    if (start) run()
    return () => cancelAnimationFrame(raf)
  }, [text, start, delay, speed])

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {out}
    </Tag>
  )
}