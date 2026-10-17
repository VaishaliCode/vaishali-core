// Shared animation values. GSAP changes these, and the 3D scene reads them every frame.
export const reactor = { assemble: 0, charge: 0, open: 0, dive: 0 }

export function resetReactor() {
  reactor.assemble = 0
  reactor.charge = 0
  reactor.open = 0
  reactor.dive = 0
}