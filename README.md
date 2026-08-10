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

Because the phone lays its iframe out at a real 393 × 852, responsive sites render
their actual mobile breakpoint rather than a scaled-down desktop one.

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

| Param         | Applies to | Example                        |
| ------------- | ---------- | ------------------------------ |
| `scene`       | —          | `macbook` (default), `iphone`  |
| `url`         | both       | `url=lobster.digital`          |
| `bg`          | both       | `bg=%23e8e4f7`                 |
| `hideUi`      | —          | `hideUi=1` hides the cog       |
| `open`        | macbook    | `open=1` opens the lid         |
| `on`          | iphone     | `on=0` powers the display off  |
| `orientation` | iphone     | `orientation=landscape`        |
| `body`        | iphone     | `body=%235b6a80` titanium hex  |

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
