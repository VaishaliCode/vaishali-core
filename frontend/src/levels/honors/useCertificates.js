import { useEffect, useState } from 'react'
import api from '../../api/client'

// Loads the certificates from the backend (already sorted by displayOrder).
export default function useCertificates() {
  const [certificates, setCertificates] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.get('/certificates')
      .then((res) => {
        setCertificates(res.data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return { certificates, status }
}