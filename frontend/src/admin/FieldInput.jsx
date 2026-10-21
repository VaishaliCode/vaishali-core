// Renders one form field from its definition in resources.js.
export default function FieldInput({ field, value, error, onChange }) {
  const id = `fld-${field.name}`
  const common = {
    id,
    name: field.name,
    required: field.required,
    'aria-invalid': error ? 'true' : undefined,
  }

  let control
  switch (field.type) {
    case 'textarea':
      control = (
        <textarea {...common} rows={field.rows ?? 4} value={value ?? ''} data-lenis-prevent
          onChange={(e) => onChange(e.target.value)} />
      )
      break

    case 'list':
      control = (
        <textarea {...common} rows={field.rows ?? 3} value={(value ?? []).join('\n')} data-lenis-prevent
          onChange={(e) => onChange(e.target.value.split('\n'))} />
      )
      break

    case 'checkbox':
      return (
        <label className="adm-check" data-cursor>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="adm-check__box" aria-hidden="true" />
          <span>{field.label}</span>
        </label>
      )

    case 'select':
      control = (
        <div className="adm-chips" role="radiogroup" aria-labelledby={`${id}-label`}>
          {field.options.map((opt) => (
            <button type="button" key={opt} role="radio" aria-checked={value === opt}
              className={`adm-chip ${value === opt ? 'is-on' : ''}`} onClick={() => onChange(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )
      break

    case 'range':
      control = (
        <div className="adm-range">
          <input {...common} type="range" min={field.min} max={field.max} value={value ?? 0}
            style={{ '--fill': `${value ?? 0}%` }}
            onChange={(e) => onChange(Number(e.target.value))} />
          <output htmlFor={id} className="adm-range__value">{value ?? 0}<small>%</small></output>
        </div>
      )
      break

    case 'number':
      control = (
        <input {...common} type="number" min={field.min} value={value ?? 0}
          onChange={(e) => onChange(e.target.value)} />
      )
      break

    default: // text, url, date
      control = (
        <input {...common} type={field.type} maxLength={field.max} value={value ?? ''}
          placeholder={field.type === 'url' ? 'https://' : undefined}
          onChange={(e) => onChange(e.target.value)} />
      )
  }

  return (
    <div className={`adm-field ${error ? 'has-error' : ''} adm-field--${field.type}`}>
      <label htmlFor={id} id={`${id}-label`} className="adm-field__label">
        <span className="mono">{field.label}{field.required && <i> *</i>}</span>
        {field.hint && <span className="adm-field__hint">{field.hint}</span>}
      </label>
      {control}
      {error && <p className="adm-field__error">{error}</p>}
    </div>
  )
}
