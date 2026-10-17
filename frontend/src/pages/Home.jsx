import { useState } from 'react'
import Ignition from '../levels/ignition/Ignition'
import Identity from '../levels/identity/Identity'

// DEV ONLY: open http://localhost:5173/?level=1 to skip the ignition while building.
// This shortcut does NOT exist on the live website.
const devLevel = import.meta.env.DEV
  ? Number(new URLSearchParams(window.location.search).get('level') ?? 0)
  : 0

export default function Home() {
  const [ignited, setIgnited] = useState(devLevel >= 1)

  if (!ignited) return <Ignition onComplete={() => setIgnited(true)} />

  return (
    <>
      <div className="arrival-flash" />
      <Identity />
    </>
  )
}