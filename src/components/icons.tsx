import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: 16,
  height: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function GridIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
    </svg>
  )
}

export function GlobeIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  )
}

export function PaletteIcon() {
  return (
    <svg {...base}>
      <path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.9-.9 1.9-1.8 0-1.3-1-1.6-1-2.7 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="7.8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="8.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PhoneIcon() {
  return (
    <svg {...base}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
      <path d="M10.5 5.2h3" />
    </svg>
  )
}

export function SlidersIcon() {
  return (
    <svg {...base}>
      <path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="14" cy="17" r="2" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg {...base} width={14} height={14} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function RecordIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...base} width={14} height={14} strokeWidth={2.4}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  )
}

export function CogIcon() {
  return (
    <svg {...base} width={20} height={20} strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.55 1.55M17.55 17.55l1.55 1.55M2.8 12h2.2M19 12h2.2M4.9 19.1l1.55-1.55M17.55 6.45l1.55-1.55" />
    </svg>
  )
}
