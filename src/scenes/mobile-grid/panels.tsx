import { ColorField, EMBED_HINT, SliderField, ToggleField, UrlListField } from '../../components/fields'
import { BACKDROPS } from '../backdrops'
import { COLUMN_RANGE, GAP_RANGE, ROTATION_RANGE, ROW_RANGE, SPEED_RANGE } from './limits'
import type { MobileGridSettings, SceneViewProps } from '../types'

export function MobileGridScreensPanel({ settings, update }: SceneViewProps<MobileGridSettings>) {
  return (
    <>
      <UrlListField
        values={settings.urls}
        onChange={(urls) => update({ urls })}
        hint={`Tiles take these in turn, left to right and then down, repeating the list until the wall is full. ${EMBED_HINT}`}
      />
      <ToggleField
        label="iPhone body"
        description="Puts a titanium phone behind every screen. Off leaves the pages floating as bare rounded panels."
        checked={settings.frame}
        onChange={(frame) => update({ frame })}
      />
      <ToggleField
        label="Scroll the pages"
        description="Pans every page down and back up again, all at the same speed. Pages shorter than about two and a half screens will show their own empty space at the bottom of the pass."
        checked={settings.pageScroll}
        onChange={(pageScroll) => update({ pageScroll })}
      />
    </>
  )
}

export function MobileGridWallPanel({ settings, update }: SceneViewProps<MobileGridSettings>) {
  const tiles = settings.columns * settings.rows

  return (
    <>
      <SliderField
        label="Columns"
        value={settings.columns}
        min={COLUMN_RANGE.min}
        max={COLUMN_RANGE.max}
        step={1}
        onChange={(columns) => update({ columns })}
        hint={`${tiles} screen${tiles === 1 ? '' : 's'} on the wall — every one is a live iframe, so a big wall is a lot of loading.`}
      />
      <SliderField
        label="Rows"
        value={settings.rows}
        min={ROW_RANGE.min}
        max={ROW_RANGE.max}
        step={1}
        onChange={(rows) => update({ rows })}
        hint="Screens in each column before it wraps around. The wall is scaled to stay gapless, so fewer rows means bigger screens."
      />
      <SliderField
        label="Gap"
        value={settings.gap}
        min={GAP_RANGE.min}
        max={GAP_RANGE.max}
        step={0.01}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(gap) => update({ gap })}
        hint="Space between phones, as a share of one phone's width — the same gap between columns and between rows."
      />
      <SliderField
        label="Rotation"
        value={settings.rotation}
        min={ROTATION_RANGE.min}
        max={ROTATION_RANGE.max}
        step={1}
        format={(value) => `${value}°`}
        onChange={(rotation) => update({ rotation })}
        hint="Turns the whole wall, columns and travel with it."
      />
      <SliderField
        label="Speed"
        value={settings.speed}
        min={SPEED_RANGE.min}
        max={SPEED_RANGE.max}
        step={0.05}
        format={(value) => `${value.toFixed(2)}/s`}
        onChange={(speed) => update({ speed })}
        hint="Screens per second, with neighbouring columns running opposite ways. Scrolling shoves the wall along on top of this — at 0 that's the only thing that moves it."
      />
    </>
  )
}

export function MobileGridBackdropPanel({ settings, update }: SceneViewProps<MobileGridSettings>) {
  return (
    <ColorField
      label="Background"
      value={settings.bgColor}
      onChange={(bgColor) => update({ bgColor })}
      swatches={BACKDROPS}
    />
  )
}
