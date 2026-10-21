import { useEffect, useState } from 'react'
import api from '../../api/client'
import { profile } from '../../data/profile'

// Loads the contact links from the backend.
// Contact details should never be "offline", so if the API is down we fall back to profile.js.
export default function useLinks() {
  const [links, setLinks] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.get('/links')
      .then((res) => setLinks(res.data.length ? res.data : profile.links))
      .catch(() => setLinks(profile.links))
      .finally(() => setStatus('ready'))
  }, [])

  return { links, status }
}