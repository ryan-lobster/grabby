import { defineScene, type MobileSphereSettings } from '../types'
import { readBoolParam, readColorParam, readNumberParam, readUrlListParam, readUrlParam } from '../params'
import { GlobeIcon, PaletteIcon, SlidersIcon } from '../../components/icons'
import { MobileSphereViewport } from './MobileSphereViewport'
import { MobileSphereBackdropPanel, MobileSphereScreensPanel, MobileSphereSpherePanel } from './panels'
import { COUNT_RANGE, OFFSET_RANGE, SIZE_RANGE, SPIN_RANGE, ZOOM_RANGE } from './limits'
import thumbnail from '../../assets/thumbs/mobile-sphere.png'

const defaults: MobileSphereSettings = {
  bgColor: '#16161c',
  urls: ['https://lobster.digital', 'https://en.wikipedia.org', 'https://en.m.wikipedia.org/wiki/Bauhaus'],
  device: 'phone',
  body: false,
  count: 24,
  size: 0.9,
  bothSides: false,
  spin: 6,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  pageScroll: false,
}

export const mobileSphereScene = defineScene<MobileSphereSettings>({
  id: 'mobile-sphere',
  label: 'Mobile sphere',
  blurb: 'Bare phone screens wrapped over a sphere you can spin.',
  thumbnail,
  // Near and far are pulled in around the sphere on purpose: drei maps a screen's DOM
  // stacking depth linearly across them, and over the default 0.1–1000 every screen
  // would land on the same z-index and stack by mount order instead.
  camera: { position: [0, 0, 32], fov: 35, near: 8, far: 64 },
  defaults,
  fromParams: (params, base) => ({
    bgColor: readColorParam(params, 'bg', base.bgColor),
    // `urls` is the list; a plain `url` — which every other scene understands — seeds a
    // one-site sphere, so the same link works whichever scene it opens.
    urls: readUrlListParam(params, 'urls', params.get('url') ? [readUrlParam(params, base.urls[0])] : base.urls),
    device: params.get('device') === 'desktop' ? 'desktop' : base.device,
    body: readBoolParam(params, 'body', base.body),
    count: Math.round(readNumberParam(params, 'count', base.count, COUNT_RANGE.min, COUNT_RANGE.max)),
    size: readNumberParam(params, 'size', base.size, SIZE_RANGE.min, SIZE_RANGE.max),
    bothSides: readBoolParam(params, 'both', base.bothSides),
    spin: readNumberParam(params, 'spin', base.spin, SPIN_RANGE.min, SPIN_RANGE.max),
    zoom: readNumberParam(params, 'zoom', base.zoom, ZOOM_RANGE.min, ZOOM_RANGE.max),
    offsetX: readNumberParam(params, 'x', base.offsetX, OFFSET_RANGE.min, OFFSET_RANGE.max),
    offsetY: readNumberParam(params, 'y', base.offsetY, OFFSET_RANGE.min, OFFSET_RANGE.max),
    pageScroll: readBoolParam(params, 'scroll', base.pageScroll),
  }),
  Viewport: MobileSphereViewport,
  tabs: [
    { id: 'screens', label: 'Screens', Icon: GlobeIcon, Panel: MobileSphereScreensPanel },
    { id: 'sphere', label: 'Sphere', Icon: SlidersIcon, Panel: MobileSphereSpherePanel },
    { id: 'backdrop', label: 'Backdrop', Icon: PaletteIcon, Panel: MobileSphereBackdropPanel },
  ],
})
