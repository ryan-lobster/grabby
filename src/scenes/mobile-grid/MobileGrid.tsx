import * as THREE from 'three'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

import { ScreenSurface } from '../../components/ScreenSurface'
import { panelGeometry, slabGeometry } from '../geometry'
import type { MobileGridSettings } from '../types'

// Same virtual viewport as the iPhone scene, so every tile renders a real mobile
// breakpoint rather than a shrunken desktop one.
const VIEWPORT_PX_W = 393
const VIEWPORT_PX_H = 852

// Tile units are the iPhone's, minus the rails: the wall is scaled to fit the
// camera at draw time, so only the proportions here matter.
const SCREEN_W = 6.54
const SCREEN_H = SCREEN_W * (VIEWPORT_PX_H / VIEWPORT_PX_W)
const BEZEL = 0.26
const BODY_D = 0.5
const BODY_RADIUS = 1.05
const SCREEN_RADIUS = BODY_RADIUS - BEZEL
const SCREEN_RADIUS_PX = (SCREEN_RADIUS / SCREEN_W) * VIEWPORT_PX_W
const BODY_COLOR = '#43423f'

/**
 * Page-scroll effect. Cross-origin pages can't be scrolled from out here, so the
 * iframe is laid out taller than the screen and slid up behind it instead — same
 * result, and no scrollbar. Kept to a modest multiple: a page shorter than this
 * would pan into its own empty space at the bottom.
 */
const PAGE_SCROLL_PX_H = Math.round(VIEWPORT_PX_H * 2.4)
/** Seconds for one pass down; it eases back up over the same time. */
const PAGE_SCROLL_SECONDS = 20

/** How far one wheel notch (~100px) shoves a column, in screen-heights. */
const SCROLL_PER_NOTCH = 0.55
/** e-folding time of that shove, in seconds. */
const SCROLL_DECAY = 0.55
/** Ceiling on scroll-driven travel, in screen-heights per second. */
const MAX_SCROLL_SPEED = 14

interface Tile {
  key: string
  url: string
  column: number
  row: number
}

export function MobileGrid({ settings }: { settings: MobileGridSettings }) {
  const { columns, rows, gap, rotation, speed, frame, pageScroll, urls } = settings
  const viewport = useThree((state) => state.viewport)
  const gl = useThree((state) => state.gl)

  const groups = useRef<(THREE.Group | null)[]>([])
  /** Travel so far, in tile units, kept inside one loop length. */
  const offset = useRef(0)
  /** Decaying scroll contribution, in screen-heights per second. */
  const scrollSpeed = useRef(0)

  const geometries = useMemo(
    () => ({
      body: slabGeometry(SCREEN_W + BEZEL * 2, SCREEN_H + BEZEL * 2, BODY_D, BODY_RADIUS, 0.12),
      display: panelGeometry(SCREEN_W, SCREEN_H, SCREEN_RADIUS),
    }),
    [],
  )

  useEffect(
    () => () => {
      for (const geometry of Object.values(geometries)) geometry.dispose()
    },
    [geometries],
  )

  const layout = useMemo(() => {
    const tileW = frame ? SCREEN_W + BEZEL * 2 : SCREEN_W
    const tileH = frame ? SCREEN_H + BEZEL * 2 : SCREEN_H
    // One gap in world units off the tile's width, used on both axes, so the spacing
    // stays square rather than stretching with the phone's aspect.
    const gapUnits = tileW * gap
    const pitchX = tileW + gapUnits
    const pitchY = tileH + gapUnits
    const wallW = columns * pitchX
    // One column's worth of travel before it repeats — also the wall's height.
    const loop = rows * pitchY

    // Measure the viewport in the wall's own (rotated) frame, then scale the wall to
    // cover it. Without this a short column would run out mid-screen and the wrap
    // point would show, and a turned wall would leave its corners empty.
    const theta = THREE.MathUtils.degToRad(rotation)
    const cos = Math.abs(Math.cos(theta))
    const sin = Math.abs(Math.sin(theta))
    const needW = viewport.width * cos + viewport.height * sin
    const needH = viewport.width * sin + viewport.height * cos
    const scale = Math.max(needW / wallW, needH / loop)

    return { pitchX, pitchY, wallW, loop, scale }
  }, [columns, rows, gap, rotation, frame, viewport.width, viewport.height])

  const tiles = useMemo(() => {
    const list: Tile[] = []
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        // Row-major, so neighbouring columns show different sites.
        list.push({ key: `${column}:${row}`, url: urls[(row * columns + column) % urls.length], column, row })
      }
    }
    return list
  }, [columns, rows, urls])

  useEffect(() => {
    // drei renders each screen into a div over the canvas, so listen on the shared
    // container: that catches the wheel whether it lands on a screen or the backdrop.
    const target = gl.domElement.parentElement ?? gl.domElement

    const onWheel = (event: WheelEvent) => {
      // Firefox reports lines (1) or pages (2) rather than pixels.
      const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * 400 : event.deltaY
      const kick = (px / 100) * (SCROLL_PER_NOTCH / SCROLL_DECAY)
      scrollSpeed.current = THREE.MathUtils.clamp(scrollSpeed.current + kick, -MAX_SCROLL_SPEED, MAX_SCROLL_SPEED)
    }

    target.addEventListener('wheel', onWheel, { passive: true })
    return () => target.removeEventListener('wheel', onWheel)
  }, [gl])

  useFrame((_, delta) => {
    // Clamp: a backgrounded tab resumes with a huge delta, which would teleport the
    // wall a long way in one step.
    const dt = Math.min(delta, 0.05)
    const { pitchX, pitchY, wallW, loop } = layout

    scrollSpeed.current *= Math.exp(-dt / SCROLL_DECAY)
    // The decay never quite reaches zero, and a wall that keeps creeping a pixel a
    // second after a flick reads as broken rather than as still.
    if (Math.abs(scrollSpeed.current) < 0.002) scrollSpeed.current = 0
    // Both speeds are in screen-heights per second, so one unit is always "a tile
    // per second" however big the wall has been scaled.
    offset.current = wrap(offset.current + (speed + scrollSpeed.current) * pitchY * dt, loop)

    for (let i = 0; i < tiles.length; i++) {
      const group = groups.current[i]
      if (!group) continue
      const tile = tiles[i]
      // Alternate columns run opposite ways; each tile wraps to the far end of its
      // own column, so `rows` tiles cover an endless strip.
      const direction = tile.column % 2 === 0 ? 1 : -1
      const base = tile.row * pitchY + pitchY / 2
      group.position.set(
        tile.column * pitchX - wallW / 2 + pitchX / 2,
        wrap(base + direction * offset.current, loop) - loop / 2,
        0,
      )
    }
    // Priority -1 rather than the default 0: drei's <Html> reads its world matrix in
    // its own frame callback, and subscriptions run in mount order, so the children
    // would otherwise position their DOM from last frame's matrix — at speed the
    // pages would visibly trail the bodies they sit in. Negative priorities only
    // sort; they don't hand rendering over the way a positive one would.
  }, -1)

  return (
    <group rotation-z={THREE.MathUtils.degToRad(rotation)} scale={layout.scale}>
      {tiles.map((tile, index) => (
        <group
          key={tile.key}
          ref={(group) => {
            groups.current[index] = group
          }}
        >
          <GridTile url={tile.url} frame={frame} pageScroll={pageScroll} geometries={geometries} />
        </group>
      ))}
    </group>
  )
}

/** Always-positive modulo — `%` alone keeps the sign, which the reversed columns hit. */
function wrap(value: number, length: number): number {
  return ((value % length) + length) % length
}

interface GridTileProps {
  url: string
  frame: boolean
  pageScroll: boolean
  geometries: { body: THREE.BufferGeometry; display: THREE.BufferGeometry }
}

function GridTile({ url, frame, pageScroll, geometries }: GridTileProps) {
  // Without a body the screen sits at z=0; with one it sits on its front face.
  const front = frame ? BODY_D / 2 : 0

  return (
    <>
      {frame && (
        <mesh geometry={geometries.body}>
          <meshStandardMaterial color={BODY_COLOR} metalness={0.68} roughness={0.28} envMapIntensity={1.4} />
        </mesh>
      )}

      {/* Glass under the page, so the rounded corners read as dark screen rather
          than as holes onto the backdrop. */}
      <mesh geometry={geometries.display} position={[0, 0, front + 0.004]}>
        <meshStandardMaterial color="#0a0a0e" metalness={0.5} roughness={0.08} envMapIntensity={1.8} />
      </mesh>

      <group position={[0, 0, front + 0.012]}>
        <ScreenSurface
          worldWidth={SCREEN_W}
          pxWidth={VIEWPORT_PX_W}
          pxHeight={VIEWPORT_PX_H}
          radiusPx={SCREEN_RADIUS_PX}
          // Non-interactive on purpose: the pages would otherwise swallow the wheel
          // the wall is steered with, and scroll themselves instead.
          interactive={false}
        >
          <iframe
            title={`Screen — ${url}`}
            src={url}
            // The screen clips this, so the page fills its full width either way —
            // `scrolling` only keeps a classic scrollbar from eating into the right
            // edge on setups that always show them.
            scrolling="no"
            style={
              {
                width: '100%',
                height: pageScroll ? PAGE_SCROLL_PX_H : '100%',
                border: 'none',
                display: 'block',
                background: '#fff',
                // Every tile runs the same keyframes over the same distance, so the
                // whole wall reads its pages at one speed. `alternate` is the turn
                // back up at the bottom.
                ...(pageScroll && {
                  '--page-travel': `${VIEWPORT_PX_H - PAGE_SCROLL_PX_H}px`,
                  animation: `page-scroll ${PAGE_SCROLL_SECONDS}s ease-in-out infinite alternate`,
                }),
              } as CSSProperties
            }
          />
          {frame && (
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
        </ScreenSurface>
      </group>
    </>
  )
}
