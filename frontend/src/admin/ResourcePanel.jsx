import { useCallback, useEffect, useState } from 'react'
import api, { readError } from '../api/client'
import FieldInput from './FieldInput'
import { emptyForm, toForm, toPayload } from './resources'

export default function ResourcePanel({ resource, notify }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null) // null | { id: number|null, form: {} }
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const { data } = await api.get(resource.endpoint)
      setItems(data)
    } catch (err) {
      setLoadError(readError(err).message)
    } finally {
      setLoading(false)
    }
  }, [resource.endpoint])

  // Reset everything when switching tabs.
  useEffect(() => {
    setEditing(null)
    setConfirmId(null)
    load()
  }, [load])

  const nextOrder = items.reduce((max, i) => Math.max(max, i.displayOrder ?? 0), 0) + 1

  function openNew() {
    setFieldErrors({})
    setFormError('')
    setEditing({ id: null, form: emptyForm(resource, nextOrder) })
  }

  function openEdit(item) {
    setFieldErrors({})
    setFormError('')
    setConfirmId(null)
    setEditing({ id: item.id, form: toForm(resource, item) })
  }

  function setField(name, value) {
    setEditing((e) => ({ ...e, form: { ...e.form, [name]: value } }))
    setFieldErrors((errs) => ({ ...errs, [name]: undefined }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setFormError('')
    const body = toPayload(resource, editing.form)
    try {
      if (editing.id) await api.put(`${resource.endpoint}/${editing.id}`, body)
      else await api.post(resource.endpoint, body)
      notify(`${resource.singular} ${editing.id ? 'updated' : 'created'}`)
      setEditing(null)
      await load()
    } catch (err) {
      const { message, fields } = readError(err)
      setFieldErrors(fields)
      setFormError(Object.keys(fields).length ? 'Fix the highlighted fields.' : message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    try {
      await api.delete(`${resource.endpoint}/${id}`)
      notify(`${resource.singular} deleted`)
      if (editing?.id === id) setEditing(null)
      setConfirmId(null)
      await load()
    } catch (err) {
      notify(readError(err).message, 'error')
    }
  }

  return (
    <section className="adm-panel">
      <header className="adm-panel__head">
        <div>
          <p className="mono">Lvl {resource.code} · /api{resource.endpoint}</p>
          <h2 className="adm-panel__title">{resource.label}</h2>
          <p className="adm-panel__count mono">
            {loading ? 'Scanning…' : `${items.length} record${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button type="button" className="adm-btn adm-btn--gold" onClick={openNew}>
          + New {resource.singular.toLowerCase()}
        </button>
      </header>

      <div className={`adm-panel__body ${editing ? 'is-editing' : ''}`}>
        {/* ---------- List ---------- */}
        <ol className="adm-list">
          {loadError && (
            <li className="adm-empty">
              <p>{loadError}</p>
              <button type="button" className="adm-btn" onClick={load}>Retry</button>
            </li>
          )}
          {!loading && !loadError && items.length === 0 && (
            <li className="adm-empty"><p>No records yet. The vault is empty.</p></li>
          )}
          {items.map((item) => (
            <li key={item.id} className={`adm-row ${editing?.id === item.id ? 'is-active' : ''}`}>
              <button type="button" className="adm-row__main" onClick={() => openEdit(item)}>
                <span className="adm-row__order mono">{String(item.displayOrder ?? 0).padStart(2, '0')}</span>
                <span className="adm-row__text">
                  <span className="adm-row__title">{resource.title(item)}</span>
                  <span className="adm-row__sub">{resource.subtitle(item)}</span>
                </span>
              </button>

              {confirmId === item.id ? (
                <span className="adm-row__confirm">
                  <span className="mono">Delete?</span>
                  <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(item.id)}>Yes</button>
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirmId(null)}>No</button>
                </span>
              ) : (
                <button type="button" className="adm-row__delete mono" onClick={() => setConfirmId(item.id)}
                  aria-label={`Delete ${resource.title(item)}`}>
                  Purge
                </button>
              )}
            </li>
          ))}
        </ol>

        {/* ---------- Editor ---------- */}
        {editing && (
          <form className="adm-editor" onSubmit={save} noValidate>
            <div className="adm-editor__head">
              <p className="mono">{editing.id ? `Editing record #${editing.id}` : 'New record'}</p>
              <button type="button" className="adm-editor__close mono" onClick={() => setEditing(null)}>Close ✕</button>
            </div>

            <div className="adm-editor__fields" data-lenis-prevent>
              {resource.fields.map((field) => (
                <FieldInput key={field.name} field={field} value={editing.form[field.name]}
                  error={fieldErrors[field.name]} onChange={(v) => setField(field.name, v)} />
              ))}
            </div>

            <div className="adm-editor__foot">
              <p className="adm-editor__error" role="alert">{formError}</p>
              <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn--gold" disabled={saving}>
                {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
