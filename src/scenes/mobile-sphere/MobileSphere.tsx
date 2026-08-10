import * as THREE from 'three'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

import { ScreenSurface } from '../../components/ScreenSurface'
import { panelGeometry, slabGeometry } from '../geometry'
import { ZOOM_RANGE } from './limits'
import type { MobileSphereSettings, SceneViewProps, ScreenDevice } from '../types'

interface DeviceSpec {
  /** Virtual viewport the embedded page is laid out at. */
  pxW: number
  pxH: number
  /** Screen corner rounding, in those same px — so it holds at any screen size. */
  radiusPx: number
  /** Bezel around the screen with the body on, as a share of the screen's width. */
  bezel: number
}

const DEVICES: Record<ScreenDevice, DeviceSpec> = {
  // A real iPhone 15 Pro in CSS px, as in the other phone scenes: sites render their
  // actual mobile breakpoint rather than a shrunken desktop one.
  phone: { pxW: 393, pxH: 852, radiusPx: 46, bezel: 0.04 },
  // A laptop-sized viewport, which is what puts a site's desktop layout on the screen.
  desktop: { pxW: 1280, pxH: 800, radiusPx: 14, bezel: 0.016 },
}

/**
 * Sphere radius in world units. The whole thing is scaled to fit the camera at draw
 * time, so only the proportions between this and the screens matter.
 */
const RADIUS = 10
/** Share of the smaller viewport dimension the sphere's diameter is fitted to. */
const FILL = 0.92
/**
 * Device thickness, as a share of the screen's shorter side. Only with a body on —
 * a bare screen is a flat panel with no thickness to catch the light at all.
 */
const BODY_DEPTH = 0.1
/** Clearance between the glass and the page over it, as a share of the screen's width. */
const LIFT = 0.004

const GLASS_COLOR = '#1e1f25'
const BODY_COLOR = '#43423f'

/**
 * Page-scroll effect, as on the wall: cross-origin pages can't be scrolled from out
 * here, so the iframe is laid out taller than the screen and slid up behind it.
 */
const PAGE_SCALE = 2.4
/** Seconds for one pass down; it eases back up over the same time. */
const PAGE_SECONDS = 20
/**
 * Golden-ratio steps around the page. Repeats of one site are offset by this, so a
 * sphere built from a short list still shows every screen at its own scroll position.
 */
const PHASE_STEP = 0.618034

/** Radians of sphere per pixel dragged. */
const DRAG_SENS = 0.0055
/** Pitch stops short of the pole — past it the sphere reads as flipping over. */
const MAX_PITCH = THREE.MathUtils.degToRad(74)
/** Tilt the sphere starts at, so the top face reads before it is touched. */
const START_PITCH = 0.14
/** e-folding time of the throw left over from a drag, in seconds. */
const SPIN_DECAY = 0.75
/** Speed a throw is dropped at, in radians per second — half a degree, below noticing. */
const THROW_FLOOR = 0.01
/** Ceiling on that throw, in radians per second. */
const MAX_THROW = 9
/** e-folding time of the wheel zoom easing toward its target, in seconds. */
const ZOOM_EASE = 0.11
/** Quiet after a wheel gesture before the zoom slider is caught up, in ms. */
const ZOOM_COMMIT_MS = 180

/**
 * Facing — the screen normal against the direction it is viewed from — that the page
 * fades out over. A DOM overlay has no back face: turned past edge-on it would render
 * its page mirrored, so it is faded out just before it gets there. With both sides on,
 * the page is turned round behind the glass while it is out of sight and fades back in
 * the other way; without, the dark glass is all that comes round the far side.
 */
const FADE_MIN = 0.05
const FADE_MAX = 0.2
/** Brightness of a screen at the back of the sphere, against one at the front. */
const BACK_SHADE = 0.62

const ORIGIN = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

// Scratch, reused every frame rather than reallocated per screen.
const quat = new THREE.Quaternion()
const normal = new THREE.Vector3()
const point = new THREE.Vector3()
const toCamera = new THREE.Vector3()

interface Tile {
  key: number
  /** Unit vector from the centre — the screen's position and its outward normal. */
  dir: THREE.Vector3
  quaternion: THREE.Quaternion
  position: [number, number, number]
  url: string
  /** Where this screen starts down its page, as a fraction of the scrollable run. */
  phase: number
}

export function MobileSphere({ settings, update }: SceneViewProps<MobileSphereSettings>) {
  const { urls, count, size, spin, pageScroll, device, body, bothSides, offsetX, offsetY } = settings
  const viewport = useThree((state) => state.viewport)
  const gl = useThree((state) => state.gl)

  const group = useRef<THREE.Group>(null)
  /** The group each page hangs off, which is what gets turned round to the other side. */
  const holders = useRef<(THREE.Group | null)[]>([])
  const faces = useRef<(HTMLDivElement | null)[]>([])
  // Last values written to the DOM, so a still sphere isn't restyled every frame.
  const opacities = useRef<number[]>([])
  const shades = useRef<number[]>([])

  /** Sphere orientation, in radians: yaw about its own axis, pitch tipping that axis. */
  const yaw = useRef(0)
  const pitch = useRef(START_PITCH)
  /** Throw left over from a drag, in radians per second. */
  const yawThrow = useRef(0)
  const pitchThrow = useRef(0)
  const dragging = useRef(false)
  /** Eased zoom, and the value it is easing toward — the wheel and the slider both set it. */
  const zoom = useRef(settings.zoom)
  const zoomTarget = useRef(settings.zoom)

  const layout = useMemo(() => {
    const spec = DEVICES[device]
    const aspect = spec.pxH / spec.pxW
    // Even spacing between neighbours at this count, which the screens are sized off:
    // more screens means smaller ones, and the sphere stays a sphere either way.
    const cell = 2 * RADIUS * Math.sqrt(Math.PI / count)
    // Off the longest side, so a landscape screen takes the same room on the sphere as
    // a portrait one instead of a whole screen's worth more width.
    const longest = cell * size
    const screenW = aspect >= 1 ? longest / aspect : longest
    const screenH = aspect >= 1 ? longest : longest * aspect
    const bezel = body ? screenW * spec.bezel : 0
    const depth = body ? Math.min(screenW, screenH) * BODY_DEPTH : 0
    const lift = screenW * LIFT
    const screenRadius = (spec.radiusPx / spec.pxW) * screenW
    // Screens sit tangent to the sphere, so they stand out past it by half their length
    // at the silhouette — fit the pair, or the sphere gets cropped top and bottom.
    const boundR = Math.hypot(RADIUS, longest / 2)
    const fit = (Math.min(viewport.width, viewport.height) * FILL) / (2 * boundR)
    return { spec, screenW, screenH, bezel, depth, lift, screenRadius, fit }
  }, [device, body, count, size, viewport.width, viewport.height])

  // Keyed off the screen's own dimensions rather than off `layout`, which also carries
  // the fit-to-viewport scale — no point re-extruding these on every step of a resize.
  const geometries = useMemo(() => {
    const { screenW, screenH, bezel, depth, screenRadius } = layout
    return {
      // Bare, the screen is a flat panel: a rounded rectangle with no thickness to it
      // at all, so nothing gives away that it is sitting in 3D.
      slab:
        depth > 0
          ? slabGeometry(screenW + bezel * 2, screenH + bezel * 2, depth, screenRadius + bezel, depth / 2.6)
          : panelGeometry(screenW, screenH, screenRadius),
      display: panelGeometry(screenW, screenH, screenRadius),
    }
  }, [layout.screenW, layout.screenH, layout.bezel, layout.depth, layout.screenRadius])

  const materials = useMemo(
    () => ({
      // Graphite for a bare screen rather than the near-black of the single-device
      // scenes: half the sphere is backs at any time, and true black reads as holes in
      // it. With a body on, that slab is the device instead, so it takes the titanium.
      slab: body
        ? new THREE.MeshStandardMaterial({ color: BODY_COLOR, metalness: 0.68, roughness: 0.28, envMapIntensity: 1.4 })
        : new THREE.MeshStandardMaterial({
            color: GLASS_COLOR,
            metalness: 0.55,
            roughness: 0.3,
            envMapIntensity: 1.5,
            // A flat panel has no back of its own: without this the far side of the
            // sphere would be see-through rather than dark.
            side: THREE.DoubleSide,
          }),
      // Glass under the page, so a body's rounded screen corners read as dark screen
      // rather than as holes onto the frame behind them.
      glass: new THREE.MeshStandardMaterial({ color: '#0a0a0e', metalness: 0.5, roughness: 0.08, envMapIntensity: 1.8 }),
    }),
    [body],
  )

  useEffect(() => {
    return () => {
      for (const geometry of Object.values(geometries)) geometry.dispose()
    }
  }, [geometries])

  useEffect(() => {
    return () => {
      for (const material of Object.values(materials)) material.dispose()
    }
  }, [materials])

  const tiles = useMemo(() => {
    const list: Tile[] = []
    const seen = new Map<string, number>()
    const matrix = new THREE.Matrix4()
    // Fibonacci sphere: an even spread at any count, without the crowded poles a
    // latitude/longitude grid would give.
    const golden = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
      // Half-step inset, so no screen lands exactly on a pole with nothing around it.
      const y = 1 - (2 * i + 1) / count
      const ring = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      const dir = new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring)

      const url = urls[i % urls.length]
      const repeat = seen.get(url) ?? 0
      seen.set(url, repeat + 1)

      list.push({
        key: i,
        dir,
        // Face the screen out of the sphere, kept as upright as the position allows.
        quaternion: new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(dir, ORIGIN, UP)),
        position: [dir.x * RADIUS, dir.y * RADIUS, dir.z * RADIUS],
        url,
        phase: (repeat * PHASE_STEP) % 1,
      })
    }
    return list
  }, [count, urls])

  // A rebuilt set of screens brings fresh, unstyled divs, so the cache of what was
  // last written to them no longer describes anything.
  useEffect(() => {
    opacities.current = []
    shades.current = []
  }, [tiles])

  // The slider is the zoom's home; the wheel below borrows it between commits.
  useEffect(() => {
    zoomTarget.current = settings.zoom
  }, [settings.zoom])

  useEffect(() => {
    // drei renders each screen into a div over the canvas, so listen on the shared
    // container: the screens are non-interactive, and a drag that starts on one lands
    // here just the same as one that starts on the backdrop.
    const target = gl.domElement.parentElement ?? gl.domElement
    if (target instanceof HTMLElement) target.style.cursor = 'grab'

    let active: number | null = null
    let lastX = 0
    let lastY = 0
    let lastMove = 0
    let commit: ReturnType<typeof setTimeout> | undefined

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      active = event.pointerId
      dragging.current = true
      lastX = event.clientX
      lastY = event.clientY
      lastMove = performance.now()
      yawThrow.current = 0
      pitchThrow.current = 0
      target.setPointerCapture?.(event.pointerId)
      if (target instanceof HTMLElement) target.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (active !== event.pointerId) return
      const now = performance.now()
      // Floor the interval: two moves in the same millisecond would otherwise throw
      // the sphere at an enormous speed on release.
      const dt = Math.max((now - lastMove) / 1000, 1 / 240)
      const dx = (event.clientX - lastX) * DRAG_SENS
      const dy = (event.clientY - lastY) * DRAG_SENS
      lastX = event.clientX
      lastY = event.clientY
      lastMove = now

      const nextPitch = THREE.MathUtils.clamp(pitch.current + dy, -MAX_PITCH, MAX_PITCH)
      // Smoothed, so the throw follows the gesture rather than its last few pixels.
      yawThrow.current = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(yawThrow.current, dx / dt, 0.4),
        -MAX_THROW,
        MAX_THROW,
      )
      pitchThrow.current = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(pitchThrow.current, (nextPitch - pitch.current) / dt, 0.4),
        -MAX_THROW,
        MAX_THROW,
      )
      yaw.current += dx
      pitch.current = nextPitch
    }

    const onPointerUp = (event: PointerEvent) => {
      if (active !== event.pointerId) return
      active = null
      dragging.current = false
      target.releasePointerCapture?.(event.pointerId)
      if (target instanceof HTMLElement) target.style.cursor = 'grab'
    }

    const onWheel = (event: WheelEvent) => {
      // Firefox reports lines (1) or pages (2) rather than pixels.
      const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * 400 : event.deltaY
      zoomTarget.current = THREE.MathUtils.clamp(
        zoomTarget.current * Math.exp(-px * 0.0012),
        ZOOM_RANGE.min,
        ZOOM_RANGE.max,
      )
      // Steer off the ref while the wheel is turning and only settle the setting once
      // it stops: committing per notch would re-render every screen mid-gesture.
      clearTimeout(commit)
      commit = setTimeout(() => update({ zoom: Number(zoomTarget.current.toFixed(2)) }), ZOOM_COMMIT_MS)
    }

    target.addEventListener('pointerdown', onPointerDown)
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointercancel', onPointerUp)
    target.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      clearTimeout(commit)
      target.removeEventListener('pointerdown', onPointerDown)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
      target.removeEventListener('pointercancel', onPointerUp)
      target.removeEventListener('wheel', onWheel)
      if (target instanceof HTMLElement) target.style.cursor = ''
    }
  }, [gl, update])

  useFrame((state, delta) => {
    // Clamp: a backgrounded tab resumes with a huge delta, which would spin the sphere
    // a long way in one step.
    const dt = Math.min(delta, 0.05)
    const sphere = group.current
    if (!sphere) return

    if (!dragging.current) {
      const decay = Math.exp(-dt / SPIN_DECAY)
      yawThrow.current *= decay
      pitchThrow.current *= decay
      // The decay never quite reaches zero, and a sphere still creeping a degree a
      // second after a flick reads as broken rather than as still.
      if (Math.abs(yawThrow.current) < THROW_FLOOR) yawThrow.current = 0
      if (Math.abs(pitchThrow.current) < THROW_FLOOR) pitchThrow.current = 0

      yaw.current += (yawThrow.current + THREE.MathUtils.degToRad(spin)) * dt
      const nextPitch = pitch.current + pitchThrow.current * dt
      pitch.current = THREE.MathUtils.clamp(nextPitch, -MAX_PITCH, MAX_PITCH)
      // Don't keep pushing into the stop — that would hold the sphere pinned there
      // for as long as the throw took to decay.
      if (pitch.current !== nextPitch) pitchThrow.current = 0
    }

    zoom.current = THREE.MathUtils.lerp(zoom.current, zoomTarget.current, 1 - Math.exp(-dt / ZOOM_EASE))

    // Default XYZ order, so yaw spins the sphere about its own (pitched) axis rather
    // than about the camera's up — the way a globe turns under a finger.
    sphere.rotation.set(pitch.current, yaw.current, 0)
    // Offsets are in half-viewports, so ±1 parks the middle of the sphere on the edge
    // of frame whatever shape the window is.
    sphere.position.set((offsetX * viewport.width) / 2, (offsetY * viewport.height) / 2, 0)
    const scale = layout.fit * zoom.current
    sphere.scale.setScalar(scale)

    quat.setFromEuler(sphere.rotation)
    const { depth, lift } = layout

    for (let i = 0; i < tiles.length; i++) {
      // The screen's normal is its own direction out of the centre, turned with the
      // sphere; its position is that same vector out to the (scaled) radius.
      normal.copy(tiles[i].dir).applyQuaternion(quat)
      point.copy(normal).multiplyScalar(RADIUS * scale).add(sphere.position)
      toCamera.copy(state.camera.position).sub(point).normalize()
      const facing = normal.dot(toCamera)

      // Turned away and set to show both sides: swing the page round to the back of the
      // glass so it reads from over there. It only ever happens while the screen is
      // edge-on and faded out, so the turn itself is never seen.
      const holder = holders.current[i]
      if (holder) {
        const flipped = bothSides && facing < 0
        holder.rotation.y = flipped ? Math.PI : 0
        holder.position.z = (flipped ? -1 : 1) * (depth / 2 + lift)
      }

      const face = faces.current[i]
      if (!face) continue
      const opacity = THREE.MathUtils.smoothstep(
        bothSides ? Math.abs(facing) : facing,
        FADE_MIN,
        FADE_MAX,
      )
      // Shade with depth as well, so the sphere reads as one solid object rather than
      // as a scatter of equally lit panels.
      const shade = THREE.MathUtils.lerp(BACK_SHADE, 1, (normal.z + 1) / 2)

      if (differs(opacities.current[i], opacity)) {
        opacities.current[i] = opacity
        face.style.opacity = opacity.toFixed(3)
        // Take a spent screen out of the compositor rather than leaving 20 invisible
        // iframes stacked over the ones on the near side.
        face.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
      }
      if (differs(shades.current[i], shade)) {
        shades.current[i] = shade
        face.style.filter = `brightness(${shade.toFixed(3)})`
      }
    }
    // Priority -1 rather than the default 0: drei's <Html> reads its world matrix in
    // its own frame callback, and subscriptions run in mount order, so the screens
    // would otherwise position their DOM from last frame's matrix — mid-spin the pages
    // would visibly trail the glass they sit in. Negative priorities only sort; they
    // don't hand rendering over the way a positive one would.
  }, -1)

  const { spec, screenW, depth, lift } = layout
  const front = depth / 2
  const glass = front + lift * 0.35

  return (
    <group ref={group}>
      {tiles.map((tile, index) => (
        <group key={tile.key} position={tile.position} quaternion={tile.quaternion}>
          {/* Bare, this panel is the screen's own glass — a rounded rectangle and
              nothing else. With a body on it is the device around it instead. */}
          <mesh geometry={geometries.slab} material={materials.slab} />
          {body && <mesh geometry={geometries.display} material={materials.glass} position={[0, 0, glass]} />}
          {/* The far side needs its own dark screen under the page once the body's
              back — which is what would otherwise be there — has a page turned onto it. */}
          {body && bothSides && (
            <mesh geometry={geometries.display} material={materials.glass} position={[0, 0, -glass]} rotation-y={Math.PI} />
          )}

          <group
            position={[0, 0, front + lift]}
            ref={(holder) => {
              holders.current[index] = holder
            }}
          >
            <ScreenSurface
              worldWidth={screenW}
              pxWidth={spec.pxW}
              pxHeight={spec.pxH}
              radiusPx={spec.radiusPx}
              // Non-interactive on purpose: an embedded page would swallow the drag
              // the sphere is turned with, and scroll itself instead.
              interactive={false}
              // Every screen overlaps the ones behind it, so they have to stack by
              // depth — the default range is too narrow to tell them apart. Safe to go
              // this wide because the canvas is its own stacking context (see Stage).
              zIndexRange={[3000, 1]}
              // Let the glass show through as the page fades out at the silhouette.
              background="transparent"
            >
              <div
                ref={(el) => {
                  faces.current[index] = el
                }}
                style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
              >
                <iframe
                  title={`Screen — ${tile.url}`}
                  src={tile.url}
                  // The screen clips this, so the page fills its full width either way —
                  // `scrolling` only keeps a classic scrollbar from eating into the
                  // right edge on setups that always show them.
                  scrolling="no"
                  style={pageStyle(tile.phase, pageScroll, spec.pxH)}
                />
                {body && device === 'phone' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: '50%',
                      width: 125,
                      height: 36,
                      transform: 'translateX(-50%)',
                      borderRadius: 999,
                      background: '#000',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </ScreenSurface>
          </group>
        </group>
      ))}
    </group>
  )
}

/** Worth a style write? Also true for a screen that hasn't been written to yet. */
function differs(previous: number | undefined, next: number): boolean {
  return previous === undefined || Math.abs(previous - next) > 0.004
}

/**
 * Where the page sits inside its screen. Every screen gets the same iframe; the ones
 * repeating a site are offset down it, either as a standing position or as a head
 * start on the scroll animation.
 */
function pageStyle(phase: number, pageScroll: boolean, pxH: number): CSSProperties {
  const pagePxH = Math.round(pxH * PAGE_SCALE)
  const travel = phase * (pagePxH - pxH)
  return {
    width: '100%',
    // Only lay the page out tall when something is going to pan it — otherwise it is
    // a viewport-height page, like the single-device scenes.
    height: pageScroll || travel > 0 ? pagePxH : '100%',
    border: 'none',
    display: 'block',
    background: '#fff',
    ...(pageScroll
      ? {
          '--page-travel': `${pxH - pagePxH}px`,
          animation: `page-scroll ${PAGE_SECONDS}s ease-in-out infinite alternate`,
          // A negative delay starts the pass partway through. The cycle is a round
          // trip, hence twice the duration.
          animationDelay: `-${(phase * PAGE_SECONDS * 2).toFixed(2)}s`,
        }
      : travel > 0 && { transform: `translateY(${-Math.round(travel)}px)` }),
  } as CSSProperties
}
