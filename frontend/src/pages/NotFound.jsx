import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ height: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <p className="mono" style={{ color: 'var(--plasma)' }}>Exception in thread "main"</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(3rem, 9vw, 7rem)', margin: '1rem 0' }}>
          Error 404: <span className="gold-text" style={{ fontStyle: 'italic' }}>Limits</span> not found.
        </h1>
        <p style={{ color: 'var(--mist)', marginBottom: '2.5rem' }}>
          This page doesn't exist. Neither do my limits.
        </p>
        <Link to="/" className="mono" style={{ color: 'var(--champagne)', borderBottom: '1px solid var(--champagne-deep)', paddingBottom: 4 }}>
          ← Return to core
        </Link>
      </div>
    </main>
  )
}