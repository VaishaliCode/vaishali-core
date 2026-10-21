// Shared animation values for Level 05. GSAP changes these, the 3D scene reads them every frame.
// lock:  0 → 1 the dish stops scanning and locks on
// beam:  0 → 1 the transmission beam fires into the sky
// pulse: a short burst every time something is transmitted
// surge: uplink established
export const transmission = { lock: 0, beam: 0, pulse: 0, surge: 0 }

export function resetTransmission() {
  transmission.lock = 0
  transmission.beam = 0
  transmission.pulse = 0
  transmission.surge = 0
}