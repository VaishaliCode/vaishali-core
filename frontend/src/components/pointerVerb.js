// "Click" on a computer, "Tap" on a phone or tablet — used in on-screen instructions.
export const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
export const tapWord = isTouch ? 'Tap' : 'Click'
export const tapLower = tapWord.toLowerCase()
