import { defineScene, type MobileGridSettings } from '../types'
import { readBoolParam, readColorParam, readNumberParam, readUrlListParam, readUrlParam } from '../params'
import { GlobeIcon, PaletteIcon, SlidersIcon } from '../../components/icons'
import { MobileGridViewport } from './MobileGridViewport'
import { MobileGridBackdropPanel, MobileGridScreensPanel, MobileGridWallPanel } from './panels'
import { COLUMN_RANGE, GAP_RANGE, ROTATION_RANGE, ROW_RANGE, SPEED_RANGE } from './limits'
import thumbnail from '../../assets/thumbs/mobile-grid.png'

const defaults: MobileGridSettings = {
  bgColor: '#16161c',
  urls: ['https://lobster.digital', 'https://en.wikipedia.org', 'https://en.m.wikipedia.org/wiki/Bauhaus'],
  columns: 4,
  rows: 3,
  gap: 0.07,
  rotation: -8,
  speed: 0.35,
  frame: true,
  pageScroll: false,
}

export const mobileGridScene = defineScene<MobileGridSettings>({
  id: 'mobile-grid',
  label: 'Mobile wall',
  blurb: 'Columns of phone screens scrolling opposite ways, on a loop.',
  thumbnail,
  camera: { position: [0, 0, 32], fov: 35 },
  defaults,
  fromParams: (params, base) => ({
    bgColor: readColorParam(params, 'bg', base.bgColor),
    // `urls` is the list; a plain `url` — which every other scene understands — seeds
    // a one-site wall, so the same link works whichever scene it opens.
    urls: readUrlListParam(params, 'urls', params.get('url') ? [readUrlParam(params, base.urls[0])] : base.urls),
    columns: Math.round(readNumberParam(params, 'cols', base.columns, COLUMN_RANGE.min, COLUMN_RANGE.max)),
    rows: Math.round(readNumberParam(params, 'rows', base.rows, ROW_RANGE.min, ROW_RANGE.max)),
    gap: readNumberParam(params, 'gap', base.gap, GAP_RANGE.min, GAP_RANGE.max),
    rotation: readNumberParam(params, 'rot', base.rotation, ROTATION_RANGE.min, ROTATION_RANGE.max),
    speed: readNumberParam(params, 'speed', base.speed, SPEED_RANGE.min, SPEED_RANGE.max),
    frame: readBoolParam(params, 'frame', base.frame),
    pageScroll: readBoolParam(params, 'scroll', base.pageScroll),
  }),
  Viewport: MobileGridViewport,
  tabs: [
    { id: 'screens', label: 'Screens', Icon: GlobeIcon, Panel: MobileGridScreensPanel },
    { id: 'wall', label: 'Wall', Icon: SlidersIcon, Panel: MobileGridWallPanel },
    { id: 'backdrop', label: 'Backdrop', Icon: PaletteIcon, Panel: MobileGridBackdropPanel },
  ],
})
