import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Recruiter from './pages/recruiter/Recruiter'
import Admin from './admin/Admin'
import { wakeServer } from './api/client'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  useEffect(() => {
    wakeServer()

    // Buttery smooth scrolling, synced with GSAP animations
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true })
    window.lenis = lenis // later levels use this to lock/unlock scrolling

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <BrowserRouter>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recruiter" element={<Recruiter />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}