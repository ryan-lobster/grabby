import { useEffect, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { normalizeUrl } from '../scenes/params'
import { CloseIcon, PlusIcon } from './icons'

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

interface UrlListFieldProps {
  values: string[]
  onChange: (urls: string[]) => void
  label?: string
  hint?: ReactNode
  addLabel?: string
}

/**
 * A repeater of page URLs. Edits commit on blur or Enter rather than on every
 * keystroke — each entry is a live iframe, and committing per character would
 * reload it on the way to a valid address.
 */
export function UrlListField({ values, onChange, label = 'Sites', hint, addLabel = 'Add site' }: UrlListFieldProps) {
  const [drafts, setDrafts] = useState(values)
  useEffect(() => setDrafts(values), [values])

  const commit = (index: number) => {
    const draft = (drafts[index] ?? '').trim()
    // An emptied field is a slip, not a request to load about:blank — put it back.
    if (!draft) {
      setDrafts(values)
      return
    }
    const next = values.map((url, i) => (i === index ? normalizeUrl(draft) : url))
    setDrafts(next)
    if (next[index] !== values[index]) onChange(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(index)
    } else if (event.key === 'Escape') {
      setDrafts(values)
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="repeat-list">
        {drafts.map((draft, index) => (
          // Index keys: entries are positional, and the same URL can appear twice.
          <div className="repeat-row" key={index}>
            <span className="repeat-index">{index + 1}</span>
            <input
              type="text"
              value={draft}
              placeholder="https://example.com"
              aria-label={`Site ${index + 1}`}
              onChange={(event) => setDrafts(drafts.map((url, i) => (i === index ? event.target.value : url)))}
              onBlur={() => commit(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove site ${index + 1}`}
              disabled={values.length < 2}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-btn" onClick={() => onChange([...values, values[values.length - 1]])}>
        <PlusIcon />
        {addLabel}
      </button>
    </Field>
  )
}

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  /** Renders the read-out beside the track; defaults to the raw number. */
  format?: (value: number) => string
  hint?: ReactNode
}

export function SliderField({ label, value, min, max, step, onChange, format, hint }: SliderFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <div className="row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <code className="mono slider-value">{format ? format(value) : value}</code>
      </div>
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
