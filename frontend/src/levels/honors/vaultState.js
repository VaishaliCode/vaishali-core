// Shared animation values for Level 04. GSAP changes these, the 3D scene reads them every frame.
// turn:   rotation of the capsule carousel (radians)
// unseal: 0 → 1 while the front capsule's locks release
// energy: 0 → 1 as more capsules are opened
// surge:  the whole vault is open
export const vault = { turn: 0, unseal: 0, energy: 0, surge: 0 }

export function resetVault() {
  vault.turn = 0
  vault.unseal = 0
  vault.energy = 0
  vault.surge = 0
}