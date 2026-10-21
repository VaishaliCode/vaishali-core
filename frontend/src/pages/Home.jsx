import { useState } from 'react'
import Ignition from '../levels/ignition/Ignition'
import Identity from '../levels/identity/Identity'
import Systems from '../levels/systems/Systems'

// DEV ONLY: open http://localhost:5173/?level=1 or ?level=2 to jump to a level while building.
// This shortcut does NOT exist on the live website.
const devLevel = import.meta.env.DEV
  ? Math.min(Number(new URLSearchParams(window.location.search).get('level') ?? 0), 2)
  : 0

export default function Home() {
  // 0 = Ignition, 1 = Identity Signal, 2 = Systems Bay
  const [level, setLevel] = useState(devLevel)

  if (level === 0) return <Ignition onComplete={() => setLevel(1)} />

  return (
    <>
      <div key={level} className="arrival-flash" />
      {level === 1 && <Identity onComplete={() => setLevel(2)} />}
      {level === 2 && <Systems />}
    </>
  )
}