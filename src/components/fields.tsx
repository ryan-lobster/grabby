import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { normalizeUrl } from '../scenes/params'

interface FieldProps {
  label: string
  hint?: ReactNode
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

interface UrlFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: ReactNode
}

export function UrlField({ value, onChange, label = 'Page URL', hint }: UrlFieldProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.trim()) onChange(normalizeUrl(draft))
  }

  return (
    <Field label={label} hint={hint}>
      <form onSubmit={submit} className="row">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://example.com"
          aria-label={label}
        />
        <button type="submit" className="primary">
          Load
        </button>
      </form>
    </Field>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (color: string) => void
  swatches?: { label: string; value: string }[]
}

export function ColorField({ label, value, onChange, swatches }: ColorFieldProps) {
  return (
    <Field label={label}>
      <div className="row">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <code className="mono">{value.toLowerCase()}</code>
      </div>
      {swatches && (
        <div className="swatches">
          {swatches.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              className={`swatch${swatch.value.toLowerCase() === value.toLowerCase() ? ' is-active' : ''}`}
              style={{ background: swatch.value }}
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={swatch.value.toLowerCase() === value.toLowerCase()}
              onClick={() => onChange(swatch.value)}
            />
          ))}
        </div>
      )}
    </Field>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <Field label={label}>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'is-active' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

interface ToggleFieldProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="toggle-row">
      <span>
        <span className="field-label">{label}</span>
        <span className="hint">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </label>
  )
}

export const EMBED_HINT =
  'Some sites block embedding (X-Frame-Options / CSP). Try one that allows it, like pmndrs.github.io or wikipedia.org.'
