export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function readUrlParam(params: URLSearchParams, fallback: string): string {
  const value = params.get('url')
  return value ? normalizeUrl(value) : fallback
}

export function readColorParam(params: URLSearchParams, key: string, fallback: string): string {
  const value = params.get(key)
  return value && /^#?[0-9a-fA-F]{3,8}$/.test(value) ? (value.startsWith('#') ? value : `#${value}`) : fallback
}

export function readBoolParam(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const value = params.get(key)
  if (value === null) return fallback
  return value === '1' || value === 'true'
}
