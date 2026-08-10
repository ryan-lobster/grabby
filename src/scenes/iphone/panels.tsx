import { ColorField, EMBED_HINT, Segmented, ToggleField, UrlField } from '../../components/fields'
import { BACKDROPS } from '../backdrops'
import type { IPhoneSettings, SceneViewProps } from '../types'

export function IPhoneScreenPanel({ settings, update }: SceneViewProps<IPhoneSettings>) {
  return (
    <>
      <UrlField
        value={settings.url}
        onChange={(url) => update({ url })}
        hint={`Laid out at 393 × 852 CSS px, so responsive sites render their mobile breakpoint. ${EMBED_HINT}`}
      />
      <Segmented
        label="Orientation"
        value={settings.orientation}
        options={[
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ]}
        onChange={(orientation) => update({ orientation })}
      />
      <ToggleField
        label="Display on"
        description="Off shows the dark glass, which shows the body off better. Clicking the model does this too."
        checked={settings.screenOn}
        onChange={(screenOn) => update({ screenOn })}
      />
    </>
  )
}

/** The four iPhone 15 Pro finishes. */
const FINISHES = [
  { label: 'Natural Titanium', value: '#bcb5ad' },
  { label: 'Blue Titanium', value: '#5b6a80' },
  { label: 'White Titanium', value: '#f0eeea' },
  { label: 'Black Titanium', value: '#43423f' },
]

export function IPhoneDevicePanel({ settings, update }: SceneViewProps<IPhoneSettings>) {
  return (
    <ColorField
      label="Finish"
      value={settings.bodyColor}
      onChange={(bodyColor) => update({ bodyColor })}
      swatches={FINISHES}
    />
  )
}

export function IPhoneBackdropPanel({ settings, update }: SceneViewProps<IPhoneSettings>) {
  return (
    <ColorField
      label="Background"
      value={settings.bgColor}
      onChange={(bgColor) => update({ bgColor })}
      swatches={BACKDROPS}
    />
  )
}
