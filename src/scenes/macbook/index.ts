import { defineScene, type MacbookSettings } from '../types'
import { readBoolParam, readColorParam, readUrlParam } from '../params'
import { GlobeIcon, PaletteIcon } from '../../components/icons'
import { MacbookViewport } from './MacbookViewport'
import { MacbookBackdropPanel, MacbookScreenPanel } from './panels'
import thumbnail from '../../assets/thumbs/macbook.png'

const defaults: MacbookSettings = {
  url: 'https://lobster.digital',
  bgColor: '#e8e8ec',
  open: false,
}

export const macbookScene = defineScene<MacbookSettings>({
  id: 'macbook',
  label: 'MacBook Pro',
  blurb: 'Floating laptop with an openable lid — desktop viewport.',
  thumbnail,
  camera: { position: [0, 0, -30], fov: 35 },
  defaults,
  fromParams: (params, base) => ({
    url: readUrlParam(params, base.url),
    bgColor: readColorParam(params, 'bg', base.bgColor),
    open: readBoolParam(params, 'open', base.open),
  }),
  Viewport: MacbookViewport,
  tabs: [
    { id: 'screen', label: 'Screen', Icon: GlobeIcon, Panel: MacbookScreenPanel },
    { id: 'backdrop', label: 'Backdrop', Icon: PaletteIcon, Panel: MacbookBackdropPanel },
  ],
})
