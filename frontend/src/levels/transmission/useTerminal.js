import { useCallback, useEffect, useRef, useState } from 'react'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * A tiny terminal: print() queues lines and shows them one after another.
 * kind 'cmd' lines are typed out letter by letter; every other kind appears whole.
 * Kinds: sys (grey), cmd ($ prompt), out (plain), ok (champagne ✓), warn (plasma !).
 */
export default function useTerminal() {
  const [log, setLog] = useState([])
  const alive = useRef(true)
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const print = useCallback((entries) => {
    queue.current = queue.current.then(async () => {
      for (const entry of entries) {
        if (!alive.current) return
        if (entry.kind === 'cmd') {
          setLog((prev) => [...prev, { ...entry, text: '' }])
          for (let i = 1; i <= entry.text.length; i++) {
            await sleep(24)
            if (!alive.current) return
            setLog((prev) => {
              const next = prev.slice()
              next[next.length - 1] = { ...entry, text: entry.text.slice(0, i) }
              return next
            })
          }
          await sleep(200)
        } else {
          await sleep(entry.wait ?? 150)
          if (!alive.current) return
          setLog((prev) => [...prev, entry])
        }
      }
    })
    return queue.current
  }, [])

  return { log, print }
}