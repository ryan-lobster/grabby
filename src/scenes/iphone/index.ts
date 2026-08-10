import { defineScene, type IPhoneSettings } from '../types'
import { readBoolParam, readColorParam, readUrlParam } from '../params'
import { GlobeIcon, PaletteIcon, PhoneIcon } from '../../components/icons'
import { IPhoneViewport } from './IPhoneViewport'
import { IPhoneBackdropPanel, IPhoneDevicePanel, IPhoneScreenPanel } from './panels'
import thumbnail from '../../assets/thumbs/iphone.png'

const defaults: IPhoneSettings = {
  url: 'https://lobster.digital',
  bgColor: '#e8e8ec',
  screenOn: true,
  bodyColor: '#bcb5ad',
  orientation: 'portrait',
}

export const iphoneScene = defineScene<IPhoneSettings>({
  id: 'iphone',
  label: 'iPhone 15 Pro',
  blurb: 'Titanium phone at a 393 × 852 mobile viewport.',
  thumbnail,
  camera: { position: [0, 0, 32], fov: 35 },
  defaults,
  fromParams: (params, base) => ({
    url: readUrlParam(params, base.url),
    bgColor: readColorParam(params, 'bg', base.bgColor),
    screenOn: readBoolParam(params, 'on', base.screenOn),
    bodyColor: readColorParam(params, 'body', base.bodyColor),
    orientation: params.get('orientation') === 'landscape' ? 'landscape' : base.orientation,
  }),
  Viewport: IPhoneViewport,
  tabs: [
    { id: 'screen', label: 'Screen', Icon: GlobeIcon, Panel: IPhoneScreenPanel },
    { id: 'device', label: 'Device', Icon: PhoneIcon, Panel: IPhoneDevicePanel },
    { id: 'backdrop', label: 'Backdrop', Icon: PaletteIcon, Panel: IPhoneBackdropPanel },
  ],
})
