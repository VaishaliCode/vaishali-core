// Shared animation values for Level 03. GSAP changes these, the 3D scene reads them every frame.
// scan: 0 → 1 while a file decrypts · energy: 0 → 1 as more files are decrypted · surge: archive unlocked
export const mission = { scan: 0, energy: 0, surge: 0 }

export function resetMission() {
  mission.scan = 0
  mission.energy = 0
  mission.surge = 0
}