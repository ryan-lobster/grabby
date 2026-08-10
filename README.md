# laptop-preview-r3f

Floating 3D device mockups that show a live website on their screen (React Three
Fiber + drei). The laptop is based on the
[pmndrs floating-laptop example](https://pmndrs.github.io/examples/examples/floating-laptop);
the phone is built from primitives in this repo.

## Scenes

Pick a scene from the cog (top right) → **Scenes**. Each scene keeps its **own
settings**, so switching between them doesn't disturb the other's setup, and each
one contributes its own tabs to the settings modal.

| Scene            | Viewport    | Settings                                     |
| ---------------- | ----------- | -------------------------------------------- |
| **MacBook Pro**  | 1280 × 537  | Page URL, lid open/closed, backdrop          |
| **iPhone 15 Pro**| 393 × 852   | Page URL, orientation, display on/off, titanium finish, backdrop |
| **Mobile wall**  | 393 × 852   | List of sites, columns, rows, gap, rotation, speed, phone body on/off, page scroll, backdrop |
| **Mobile sphere**| 393 × 852 / 1280 × 800 | Phone or desktop screens, list of sites, device body on/off, screen count, screen size, screens on both sides, spin, zoom, offsets, page scroll, backdrop |

Because the phone lays its iframe out at a real 393 × 852, responsive sites render
their actual mobile breakpoint rather than a scaled-down desktop one.

**Mobile wall** tiles that phone into columns that scroll in alternating directions
and wrap around, so `rows` screens cover an endless strip. Sites are a repeating
list — the wall takes them in turn, left to right and then down. Scrolling anywhere
on the scene shoves the wall along on top of whatever **Speed** is set to, so a
speed of 0 leaves a wall that only moves when you do. The screens are deliberately
not clickable there: the embedded pages would otherwise swallow the wheel. Every
tile is a live iframe, so a 6 × 6 wall is 36 pages loading at once.

**Mobile sphere** spreads screens evenly over a sphere, each one tangent to it and
facing out, so the near ones are large and the far ones small. Drag to turn it and
let go to throw it; the wheel zooms. Sites are a repeating list again, but a site
that comes round a second time is shown from a different point down its page — so a
single URL still fills the sphere with different screens. Like the wall, the screens
aren't clickable: a page would swallow the drag and scroll itself instead.

**Screens** switches the whole sphere between phone screens at 393 × 852 and desktop
ones at 1280 × 800, which is what decides whether sites render their mobile or their
desktop breakpoint. **Device body** wraps each screen in a phone or a bezel; with it
off a screen is a flat rounded rectangle with no thickness at all — just the page.

On the **Sphere** tab, **Screens** sets how many there are and sizes them with it
(they're scaled to the spacing that count works out at), **Spin** is the idle turn it
makes on its own, and **Zoom** / **Left–right** / **Up–down** frame it: the offsets
are half-viewports either side of centre, so ±1 parks the middle of the sphere on the
edge of frame. The wheel drives the same zoom and lands back on the slider when it
stops.

About half the screens face away at any time, and a DOM overlay has no back face —
turned past edge-on it would render its page mirrored. **Screens on both sides**
turns the page round behind the glass as that happens, so the far half of the sphere
reads as well as the near one and it still costs one iframe per screen. Off, each
page fades out just before edge-on and the dark glass comes round instead.

**Scroll the pages** pans every page down its own length and eases back up, all at
one speed — on the sphere each screen starts at its own point in that pass. A
cross-origin page can't be scrolled from outside it, so the iframe is laid out 2.4
screens tall and slid up behind the screen instead — which means a page shorter than
that pans into its own empty space at the bottom of the pass.

Sites that send `X-Frame-Options` / a restrictive `Content-Security-Policy` (most
big platforms) can't be embedded — a browser limitation, not something this app can
work around. Try your own site, or `pmndrs.github.io` / `wikipedia.org`.

**Record** (under Output) captures a video via `getDisplayMedia` — a screen/tab
capture rather than the WebGL canvas directly, since canvas capture can't see the
DOM-based screen overlay and cross-origin iframe pixels aren't readable anyway.
Choose "This Tab" when prompted. It downloads as a `.webm` when you stop.

## Deep links

Everything is drivable from the query string, which is how the recording script
gets a clean frame:

| Param         | Applies to  | Example                                    |
| ------------- | ----------- | ------------------------------------------ |
| `scene`       | —           | `macbook` (default), `iphone`, `mobile-grid`, `mobile-sphere` |
| `url`         | all         | `url=lobster.digital`                      |
| `bg`          | all         | `bg=%23e8e4f7`                             |
| `hideUi`      | —           | `hideUi=1` hides the cog                   |
| `open`        | macbook     | `open=1` opens the lid                     |
| `on`          | iphone      | `on=0` powers the display off              |
| `orientation` | iphone      | `orientation=landscape`                    |
| `body`        | iphone      | `body=%235b6a80` titanium hex              |
| `urls`        | both mobile | `urls=lobster.digital,wikipedia.org`       |
| `scroll`      | both mobile | `scroll=1` pans the pages                  |
| `cols`        | mobile-grid | `cols=5` (1–6)                             |
| `rows`        | mobile-grid | `rows=4` (1–6)                             |
| `gap`         | mobile-grid | `gap=0.25` phone widths (0–0.5)            |
| `rot`         | mobile-grid | `rot=-35` degrees (−90–90)                 |
| `speed`       | mobile-grid | `speed=0` screens per second (0–4)         |
| `frame`       | mobile-grid | `frame=0` drops the phone bodies           |
| `device`      | mobile-sphere | `device=desktop` for 1280 × 800 screens  |
| `body`        | mobile-sphere | `body=1` adds the phone / bezel          |
| `count`       | mobile-sphere | `count=30` screens (3–36)                |
| `size`        | mobile-sphere | `size=1.2` of the even spacing (0.5–1.5) |
| `both`        | mobile-sphere | `both=1` puts a page on both sides       |
| `spin`        | mobile-sphere | `spin=0` degrees per second (0–60)       |
| `zoom`        | mobile-sphere | `zoom=1.4` of the fitted size (0.6–1.8)  |
| `x`, `y`      | mobile-sphere | `x=-0.45&y=0.25` half-viewports (−1–1)   |

On the wall and the sphere, `url` is shorthand for a one-site `urls` — which on the
sphere is the interesting case, since every screen then shows that one site from its
own scroll position.

## Adding a scene

Scenes are self-describing — a config in `src/scenes/<id>/index.ts` declares its
defaults, camera, query-param parsing, 3D viewport and settings tabs. Add it to
`SCENES` in [src/scenes/registry.ts](src/scenes/registry.ts), extend
`SceneSettingsMap` in [src/scenes/types.ts](src/scenes/types.ts), then regenerate
the picker tiles:

```bash
node scripts/capture-thumbs.mjs
```

That spins up a throwaway vite server, loads each scene with the UI hidden, and
writes 2x screenshots to `src/assets/thumbs/`. Re-run it whenever a scene's look
changes.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
