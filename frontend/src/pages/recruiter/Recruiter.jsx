import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useResume from './useResume'
import { CATEGORY_ORDER } from '../../levels/systems/useSkills'
import './recruiter.css'

const CATEGORY_LABELS = {
  LANGUAGE: 'Languages',
  FRAMEWORK: 'Frameworks',
  DATABASE: 'Databases',
  TOOL: 'Tools',
  CORE: 'Core CS',
  CONCEPT: 'Concepts',
  FRONTEND: 'Frontend',
}

// A link only counts as a real repo when it points past the GitHub profile itself
const realRepo = (url) => url && !/github\.com\/[^/]+\/?$/.test(url)
const isMail = (url) => url?.startsWith('mailto:')
const display = (url) => url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const formatDate = (iso) => {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function groupSkills(skills) {
  const map = {}
  for (const s of skills) (map[s.category] ??= []).push(s)
  return CATEGORY_ORDER.filter((c) => map[c]).map((c) => ({ category: c, skills: map[c] }))
}

function Section({ title, className = '', children }) {
  return (
    <section className={`rv-block ${className}`}>
      <h2 className="mono rv-block__title">{title}</h2>
      {children}
    </section>
  )
}

export default function Recruiter() {
  const { data, status } = useResume()

  useEffect(() => {
    document.title = 'Vaishali Muley — Résumé'
    window.lenis?.start()
    window.lenis?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    return () => { document.title = 'Vaishali Muley — Core' }
  }, [])

  return (
    <main className="rv">
      {/* ---------- Top bar ---------- */}
      <nav className="rv-bar" aria-label="Recruiter view">
        <span className="mono rv-bar__brand">
          Vaishali<span className="hud__accent">//</span>Core <span className="rv-bar__sep">·</span> Recruiter view
        </span>
        <div className="rv-bar__actions">
          <span className={`mono rv-sync rv-sync--${status}`} title={STATUS_TITLES[status]}>
            <i /> {STATUS_LABELS[status]}
          </span>
          <button type="button" className="mono rv-btn rv-btn--ghost" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <Link to="/" className="mono rv-btn rv-btn--gold">⬡ Experience the full core</Link>
        </div>
      </nav>

      {data ? <Sheet data={data} /> : <SheetLoading />}
    </main>
  )
}

const STATUS_LABELS = { loading: 'Syncing…', live: 'Live', backup: 'Saved copy' }
const STATUS_TITLES = {
  loading: 'Loading the latest details from the server',
  live: 'Showing the latest details from the server',
  backup: 'The server is waking up — showing a saved copy; it updates automatically',
}

function Sheet({ data }) {
  const { profile, education, skills, projects, certificates, links } = data
  const groups = groupSkills(skills)
  const email = links.find((l) => isMail(l.url))

  return (
    <div className="rv-sheet">
      {/* ---------- Header ---------- */}
      <header className="rv-head">
        <div>
          <h1 className="rv-head__name">
            {profile.firstName} <span className="gold-text">{profile.lastName}</span>
          </h1>
          {profile.headline && <p className="rv-head__role">{profile.headline}</p>}
          {(profile.location || profile.seeking) && (
            <p className="mono rv-head__meta">
              {profile.location && <span>{profile.location}</span>}
              {profile.seeking && <span>◆ Open to {profile.seeking}</span>}
            </p>
          )}
        </div>

        <ul className="rv-contact">
          {links.map((l) => (
            <li key={l.id ?? l.label}>
              <a href={l.url} target={isMail(l.url) ? undefined : '_blank'} rel="noreferrer">
                <span className="mono rv-contact__label">{l.label}</span>
                <span className="rv-contact__value">{display(l.url)}</span>
              </a>
            </li>
          ))}
        </ul>
      </header>

      {profile.summary && <p className="rv-summary">{profile.summary}</p>}

      <div className="rv-grid">
        {/* ---------- Main column ---------- */}
        <div className="rv-main">
          {projects.length > 0 && <Section title="Projects" className="rv-block--projects">
            <div className="rv-projects">
              {projects.map((p) => (
                <article className="rv-project" key={p.id ?? p.title}>
                  <div className="rv-project__head">
                    <h3>{p.title}</h3>
                    <div className="rv-project__links">
                      {realRepo(p.githubUrl) ? (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="mono">Source ↗</a>
                      ) : (
                        <span className="mono rv-muted">Source · releasing soon</span>
                      )}
                      {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" className="mono">Live ↗</a>}
                    </div>
                  </div>
                  {p.tagline && <p className="rv-project__tagline">{p.tagline}</p>}
                  {p.highlights?.length > 0 ? (
                    <ul className="rv-list">
                      {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  ) : (
                    p.description && <p className="rv-text">{p.description}</p>
                  )}
                  {p.techStack?.length > 0 && (
                    <ul className="rv-tags">
                      {p.techStack.map((t) => <li key={t} className="mono">{t}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </Section>}

          {certificates.length > 0 && <Section title="Certifications" className="rv-block--certs">
            <ul className="rv-certs">
              {certificates.map((c) => {
                const date = formatDate(c.issuedOn)
                return (
                  <li key={c.id ?? c.title}>
                    <div>
                      <p className="rv-certs__title">{c.title}</p>
                      <p className="rv-muted">{c.issuer}{date ? ` · ${date}` : ''}</p>
                    </div>
                    {c.credentialUrl && (
                      <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="mono">Verify ↗</a>
                    )}
                  </li>
                )
              })}
            </ul>
          </Section>}
        </div>

        {/* ---------- Side column ---------- */}
        <aside className="rv-side">
          {groups.length > 0 && <Section title="Technical skills" className="rv-block--skills">
            <dl className="rv-skills">
              {groups.map((g) => (
                <div key={g.category}>
                  <dt className="mono">{CATEGORY_LABELS[g.category] ?? g.category}</dt>
                  <dd>{g.skills.map((s) => s.name).join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </Section>}

          {education.length > 0 && <Section title="Education" className="rv-block--edu">
            {education.map((e) => (
              <div className="rv-edu" key={e.id ?? e.degree}>
                <p className="rv-edu__degree">{e.degree}</p>
                <p className="rv-muted">{[e.school, e.place].filter(Boolean).join(', ')}</p>
                {(e.period || e.score) && (
                  <p className="mono rv-edu__meta">{[e.period, e.score].filter(Boolean).join(' · ')}</p>
                )}
              </div>
            ))}
          </Section>}

          {profile.achievements.length > 0 && <Section title="Achievements" className="rv-block--wins">
            <ul className="rv-list">
              {profile.achievements.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </Section>}

          {profile.languages.length > 0 && <Section title="Languages" className="rv-block--langs">
            <p className="rv-text">{profile.languages.join(' · ')}</p>
          </Section>}
        </aside>
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="rv-foot">
        {email && (
          <a href={email.url} className="mono rv-btn rv-btn--gold">Email me ↗</a>
        )}
        <p className="rv-muted">
          Prefer the cinematic version? <Link to="/">Ignite the core →</Link>
        </p>
      </footer>
    </div>
  )
}

function SheetLoading() {
  return (
    <div className="rv-sheet rv-sheet--loading" aria-busy="true">
      <span className="rv-skel rv-skel--name" />
      <span className="rv-skel rv-skel--line" />
      <span className="rv-skel rv-skel--line rv-skel--short" />
      <span className="rv-skel rv-skel--block" />
      <p className="mono rv-loading-note">Loading the latest résumé…</p>
    </div>
  )
}
