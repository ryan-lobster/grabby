import { ColorField, EMBED_HINT, Segmented, SliderField, ToggleField, UrlListField } from '../../components/fields'
import { BACKDROPS } from '../backdrops'
import { COUNT_RANGE, OFFSET_RANGE, SIZE_RANGE, SPIN_RANGE, ZOOM_RANGE } from './limits'
import type { MobileSphereSettings, SceneViewProps, ScreenDevice } from '../types'

export function MobileSphereScreensPanel({ settings, update }: SceneViewProps<MobileSphereSettings>) {
  return (
    <>
      <Segmented<ScreenDevice>
        label="Screens"
        value={settings.device}
        options={[
          { label: 'Phone', value: 'phone' },
          { label: 'Desktop', value: 'desktop' },
        ]}
        onChange={(device) => update({ device })}
      />
      <UrlListField
        values={settings.urls}
        onChange={(urls) => update({ urls })}
        hint={`Laid out at ${
          settings.device === 'phone' ? '393 × 852, so sites render their mobile' : '1280 × 800, so sites render their desktop'
        } breakpoint. Screens take the list in turn, repeating it until the sphere is full, and a site that comes round again is shown from a different point down its page — so even a single URL fills the sphere with different screens. ${EMBED_HINT}`}
      />
      <ToggleField
        label="Device body"
        description="Wraps every screen in a phone or a bezel. Off leaves the pages floating as bare rounded rectangles."
        checked={settings.body}
        onChange={(body) => update({ body })}
      />
      <ToggleField
        label="Scroll the pages"
        description="Pans every page down and back up again, each screen starting at its own point in the pass. Pages shorter than about two and a half screens will show their own empty space at the bottom."
        checked={settings.pageScroll}
        onChange={(pageScroll) => update({ pageScroll })}
      />
    </>
  )
}

export function MobileSphereSpherePanel({ settings, update }: SceneViewProps<MobileSphereSettings>) {
  return (
    <>
      <SliderField
        label="Screens"
        value={settings.count}
        min={COUNT_RANGE.min}
        max={COUNT_RANGE.max}
        step={1}
        onChange={(count) => update({ count })}
        hint="Spread evenly over the whole sphere. Every one is a live iframe, so a full sphere is a lot of loading."
      />
      <SliderField
        label="Screen size"
        value={settings.size}
        min={SIZE_RANGE.min}
        max={SIZE_RANGE.max}
        step={0.05}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(size) => update({ size })}
        hint="Against the spacing the screen count works out at — 100% leaves them just clear of each other, more overlaps them into a shell."
      />
      <ToggleField
        label="Screen on both sides"
        description="Puts the page on whichever side of the screen is showing, so the far half of the sphere reads as well as the near one. Off, only the fronts have a page and the backs come round dark."
        checked={settings.bothSides}
        onChange={(bothSides) => update({ bothSides })}
      />
      <SliderField
        label="Spin"
        value={settings.spin}
        min={SPIN_RANGE.min}
        max={SPIN_RANGE.max}
        step={1}
        format={(value) => `${value}°/s`}
        onChange={(spin) => update({ spin })}
        hint="Idle turn about the sphere's own axis. Drag to throw it whichever way you like — at 0 that's the only thing that moves it."
      />
      <SliderField
        label="Zoom"
        value={settings.zoom}
        min={ZOOM_RANGE.min}
        max={ZOOM_RANGE.max}
        step={0.05}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(zoom) => update({ zoom })}
        hint="Against the size the sphere is fitted to the window at. The wheel does the same thing, and lands back here when it stops."
      />
      <SliderField
        label="Left / right"
        value={settings.offsetX}
        min={OFFSET_RANGE.min}
        max={OFFSET_RANGE.max}
        step={0.05}
        format={signed}
        onChange={(offsetX) => update({ offsetX })}
        hint="Centre of the frame at 0. Both offsets are half-viewports, so ±1 parks the middle of the sphere on the edge."
      />
      <SliderField
        label="Up / down"
        value={settings.offsetY}
        min={OFFSET_RANGE.min}
        max={OFFSET_RANGE.max}
        step={0.05}
        format={signed}
        onChange={(offsetY) => update({ offsetY })}
      />
    </>
  )
}

export function MobileSphereBackdropPanel({ settings, update }: SceneViewProps<MobileSphereSettings>) {
  return (
    <ColorField
      label="Background"
      value={settings.bgColor}
      onChange={(bgColor) => update({ bgColor })}
      swatches={BACKDROPS}
    />
  )
}

/** Reads as an offset from centre rather than as a bare number. */
function signed(value: number): string {
  return value === 0 ? '0' : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`
}
