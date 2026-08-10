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

export function readNumberParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback
}

/** Comma-separated list of sites, e.g. `urls=lobster.digital,wikipedia.org`. */
export function readUrlListParam(params: URLSearchParams, key: string, fallback: string[]): string[] {
  const raw = params.get(key)
  if (!raw) return fallback
  const urls = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizeUrl)
  return urls.length > 0 ? urls : fallback
}
