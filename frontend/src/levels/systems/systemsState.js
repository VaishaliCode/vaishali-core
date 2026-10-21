// Shared animation values for Level 02. GSAP changes these, the 3D scene reads them every frame.
// power: 0 → 1 as cells dock · surge: the flash when every system comes online
export const systems = { power: 0, surge: 0 }

export function resetSystems() {
  systems.power = 0
  systems.surge = 0
}