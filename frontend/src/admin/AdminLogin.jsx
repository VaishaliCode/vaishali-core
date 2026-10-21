import { useState } from 'react'
import api, { readError } from '../api/client'
import { setToken } from './auth'

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { username: username.trim(), password })
      setToken(data.token)
      onSuccess()
    } catch (err) {
      setError(readError(err).message)
      setBusy(false)
    }
  }

  return (
    <main className="adm-login">
      <div className="adm-login__halo" aria-hidden="true" />

      <form className="adm-login__card" onSubmit={submit}>
        <p className="mono adm-login__eyebrow">Restricted sector · Clearance required</p>
        <h1 className="adm-login__title">
          Core <em className="gold-text">Control</em>
        </h1>
        <p className="adm-login__lede">Authenticate to modify the reactor's records.</p>

        <label className="adm-field">
          <span className="adm-field__label"><span className="mono">Operator</span></span>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" autoFocus required />
        </label>

        <label className="adm-field">
          <span className="adm-field__label"><span className="mono">Passphrase</span></span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required />
        </label>

        <p className="adm-login__error" role="alert">{error}</p>

        <button type="submit" className="adm-btn adm-btn--gold adm-btn--wide" disabled={busy}>
          {busy ? 'Verifying…' : 'Authenticate'}
        </button>

        <a href="/" className="mono adm-login__back">← Return to core</a>
      </form>
    </main>
  )
}
