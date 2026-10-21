import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { clearToken, getToken, tokenExpiry } from './auth'
import AdminLogin from './AdminLogin'
import ResourcePanel from './ResourcePanel'
import { RESOURCES } from './resources'
import './admin.css'

export default function Admin() {
  // 'checking' → asking the API if the saved token still works; then 'in' or 'out'
  const [status, setStatus] = useState(() => (getToken() ? 'checking' : 'out'))
  const [operator, setOperator] = useState('')

  const verify = useCallback(async () => {
    if (!getToken()) return setStatus('out')
    try {
      const { data } = await api.get('/auth/me')
      setOperator(data.username)
      setStatus('in')
    } catch {
      clearToken()
      setStatus('out')
    }
  }, [])

  useEffect(() => {
    document.title = 'Core Control — Vaishali//Core'
    window.lenis?.start() // levels may have locked scrolling
    verify()
    const onLogout = () => setStatus('out')
    window.addEventListener('core:logout', onLogout)
    return () => window.removeEventListener('core:logout', onLogout)
  }, [verify])

  // Log out automatically the moment the token expires.
  useEffect(() => {
    if (status !== 'in') return
    const exp = tokenExpiry(getToken())
    if (!exp) return
    const timer = setTimeout(() => {
      clearToken()
      setStatus('out')
    }, Math.max(0, exp - Date.now()))
    return () => clearTimeout(timer)
  }, [status])

  if (status === 'checking') {
    return <main className="adm-login"><p className="mono">Verifying clearance…</p></main>
  }
  if (status === 'out') return <AdminLogin onSuccess={verify} />

  return <Console operator={operator} onLogout={() => { clearToken(); setStatus('out') }} />
}

function Console({ operator, onLogout }) {
  const [params, setParams] = useSearchParams()
  const active = RESOURCES.find((r) => r.key === params.get('tab')) ?? RESOURCES[0]
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  const notify = useCallback((message, tone = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ message, tone, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  return (
    <div className="adm">
      <span className="adm-corner adm-corner--tl" />
      <span className="adm-corner adm-corner--tr" />
      <span className="adm-corner adm-corner--bl" />
      <span className="adm-corner adm-corner--br" />

      <header className="adm-top">
        <a href="/" className="mono adm-top__brand">Vaishali<span>//</span>Core</a>
        <p className="mono adm-top__status"><i className="adm-pulse" /> Core Control · Operator {operator}</p>
        <button type="button" className="mono adm-top__logout" onClick={onLogout}>Seal session</button>
      </header>

      <div className="adm-shell">
        <nav className="adm-nav" aria-label="Records">
          <p className="mono adm-nav__label">Records</p>
          {RESOURCES.map((r) => (
            <button type="button" key={r.key}
              className={`adm-nav__item ${r.key === active.key ? 'is-active' : ''}`}
              aria-current={r.key === active.key ? 'page' : undefined}
              onClick={() => setParams({ tab: r.key })}>
              <span className="mono">{r.code}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </nav>

        <ResourcePanel key={active.key} resource={active} notify={notify} />
      </div>

      {toast && (
        <div key={toast.id} className={`adm-toast adm-toast--${toast.tone}`} role="status">
          <span className="mono">{toast.tone === 'ok' ? 'Committed' : 'Fault'}</span>
          {toast.message}
        </div>
      )}
    </div>
  )
}
