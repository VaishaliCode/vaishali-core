import { useState } from 'react'
import Ignition from '../levels/ignition/Ignition'
import Identity from '../levels/identity/Identity'
import Systems from '../levels/systems/Systems'
import Missions from '../levels/missions/Missions'
import Honors from '../levels/honors/Honors'
import Transmission from '../levels/transmission/Transmission'

// DEV ONLY: open http://localhost:5173/?level=1, 2, 3, 4 or 5 to jump to a level while building.
// This shortcut does NOT exist on the live website.
const devLevel = import.meta.env.DEV
  ? Math.min(Number(new URLSearchParams(window.location.search).get('level') ?? 0), 5)
  : 0

export default function Home() {
  // 0 = Ignition, 1 = Identity Signal, 2 = Systems Bay, 3 = Mission Archive, 4 = Honors Vault, 5 = Transmission
  const [level, setLevel] = useState(devLevel)

  if (level === 0) return <Ignition onComplete={() => setLevel(1)} />

  return (
    <>
      <div key={level} className="arrival-flash" />
      {level === 1 && <Identity onComplete={() => setLevel(2)} />}
      {level === 2 && <Systems onComplete={() => setLevel(3)} />}
      {level === 3 && <Missions onComplete={() => setLevel(4)} />}
      {level === 4 && <Honors onComplete={() => setLevel(5)} />}
      {level === 5 && <Transmission onRestart={() => setLevel(0)} />}
    </>
  )
}