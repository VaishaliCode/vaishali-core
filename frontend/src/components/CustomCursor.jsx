import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50 })

    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' })
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' })
    const ringX = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ringY = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })

    const onMove = (e) => {
      dotX(e.clientX); dotY(e.clientY)
      ringX(e.clientX); ringY(e.clientY)
    }
    const onOver = (e) => {
      const hit = e.target.closest('a, button, [data-cursor]')
      ring.current?.classList.toggle('is-hover', !!hit)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  )
}