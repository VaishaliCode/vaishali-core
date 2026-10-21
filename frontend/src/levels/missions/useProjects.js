import { useEffect, useState } from 'react'
import api from '../../api/client'

// Loads the projects from the backend (already sorted by displayOrder).
export default function useProjects() {
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.get('/projects')
      .then((res) => {
        setProjects(res.data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return { projects, status }
}