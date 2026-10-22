import { useEffect, useState } from 'react'
import api from '../../api/client'
import { resume } from '../../data/resume'

const KEYS = ['profile', 'education', 'skills', 'projects', 'certificates', 'links']
const BACKUP_AFTER_MS = 4000 // how long to wait for the live data before showing the backup copy

// Loads everything on the recruiter page live from the backend.
// status: 'loading' → 'live' (real data)  or  'backup' (server still waking up / down → data/resume.js)
export default function useResume() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let alive = true
    const backup = setTimeout(() => {
      if (!alive) return
      setData((d) => d ?? toPage(resume.fallback))
      setStatus((s) => (s === 'loading' ? 'backup' : s))
    }, BACKUP_AFTER_MS)

    Promise.allSettled(KEYS.map((k) => api.get(`/${k}`).then((res) => res.data)))
      .then((results) => {
        if (!alive) return
        clearTimeout(backup)
        // Any list the server couldn't send falls back to the backup copy; the rest is live.
        const merged = Object.fromEntries(KEYS.map((k, i) =>
          [k, results[i].status === 'fulfilled' ? results[i].value : resume.fallback[k]]))
        const profile = Array.isArray(merged.profile) ? merged.profile[0] : merged.profile
        setData(toPage({ ...merged, profile: profile ?? resume.fallback.profile }))
        setStatus(results.every((r) => r.status === 'fulfilled') ? 'live' : 'backup')
      })

    return () => {
      alive = false
      clearTimeout(backup)
    }
  }, [])

  return { data, status }
}

// Makes sure every list exists so the page never crashes on a missing field.
function toPage(src) {
  const p = src.profile ?? {}
  return {
    profile: { ...p, achievements: p.achievements ?? [], languages: p.languages ?? [] },
    education: src.education ?? [],
    skills: src.skills ?? [],
    projects: src.projects ?? [],
    certificates: src.certificates ?? [],
    links: src.links ?? [],
  }
}
