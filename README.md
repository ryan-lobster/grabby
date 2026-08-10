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

Because the phone lays its iframe out at a real 393 × 852, responsive sites render
their actual mobile breakpoint rather than a scaled-down desktop one.

**Mobile wall** tiles that phone into columns that scroll in alternating directions
and wrap around, so `rows` screens cover an endless strip. Sites are a repeating
list — the wall takes them in turn, left to right and then down. Scrolling anywhere
on the scene shoves the wall along on top of whatever **Speed** is set to, so a
speed of 0 leaves a wall that only moves when you do. The screens are deliberately
not clickable there: the embedded pages would otherwise swallow the wheel. Every
tile is a live iframe, so a 6 × 6 wall is 36 pages loading at once.

**Scroll the pages** pans every page down its own length and eases back up, all at
one speed. A cross-origin page can't be scrolled from outside it, so the iframe is
laid out 2.4 screens tall and slid up behind the screen instead — which means a page
shorter than that pans into its own empty space at the bottom of the pass.

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
| `scene`       | —           | `macbook` (default), `iphone`, `mobile-grid` |
| `url`         | all         | `url=lobster.digital`                      |
| `bg`          | all         | `bg=%23e8e4f7`                             |
| `hideUi`      | —           | `hideUi=1` hides the cog                   |
| `open`        | macbook     | `open=1` opens the lid                     |
| `on`          | iphone      | `on=0` powers the display off              |
| `orientation` | iphone      | `orientation=landscape`                    |
| `body`        | iphone      | `body=%235b6a80` titanium hex              |
| `urls`        | mobile-grid | `urls=lobster.digital,wikipedia.org`       |
| `cols`        | mobile-grid | `cols=5` (1–6)                             |
| `rows`        | mobile-grid | `rows=4` (1–6)                             |
| `gap`         | mobile-grid | `gap=0.25` phone widths (0–0.5)            |
| `rot`         | mobile-grid | `rot=-35` degrees (−90–90)                 |
| `speed`       | mobile-grid | `speed=0` screens per second (0–4)         |
| `frame`       | mobile-grid | `frame=0` drops the phone bodies           |
| `scroll`      | mobile-grid | `scroll=1` pans the pages                  |

On the wall, `url` is shorthand for a one-site `urls`.

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
