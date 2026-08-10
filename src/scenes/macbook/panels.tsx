import { ColorField, EMBED_HINT, ToggleField, UrlField } from '../../components/fields'
import { BACKDROPS } from '../backdrops'
import type { MacbookSettings, SceneViewProps } from '../types'

export function MacbookScreenPanel({ settings, update }: SceneViewProps<MacbookSettings>) {
  return (
    <>
      <UrlField value={settings.url} onChange={(url) => update({ url })} hint={EMBED_HINT} />
      <ToggleField
        label="Lid open"
        description="Closed docks the laptop; open floats and drifts it. Clicking the model does this too."
        checked={settings.open}
        onChange={(open) => update({ open })}
      />
    </>
  )
}

export function MacbookBackdropPanel({ settings, update }: SceneViewProps<MacbookSettings>) {
  return (
    <ColorField
      label="Background"
      value={settings.bgColor}
      onChange={(bgColor) => update({ bgColor })}
      swatches={BACKDROPS}
    />
  )
}
