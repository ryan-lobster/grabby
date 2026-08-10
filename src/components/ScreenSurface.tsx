import type * as THREE from 'three'
import type { ReactNode, RefObject } from 'react'
import { Html } from '@react-three/drei'

interface ScreenSurfaceProps {
  /** Width of the display area in world units — sets the CSS-px-to-world scale. */
  worldWidth: number
  /** Virtual viewport the embedded page is laid out at. */
  pxWidth: number
  pxHeight: number
  /**
   * Meshes to occlude against. Occluding against the whole scene doesn't work here:
   * the overlay sits exactly where the display mesh is, so a scene-wide raycast hits
   * that mesh itself and the overlay never resolves. Leave it off for a screen that
   * nothing can pass in front of — the check is a raycast per screen per frame.
   */
  occlude?: RefObject<THREE.Object3D | null>[]
  interactive: boolean
  /** Screen corner rounding, in the same CSS px as pxWidth/pxHeight. */
  radiusPx?: number
  /** Local roll, used to keep the page upright when the device itself is rotated. */
  rotationZ?: number
  /** Transparent lets the display mesh behind the overlay show through. */
  background?: string
  /**
   * Range the screen's own stacking order is mapped into, near plane to far. drei
   * spreads it linearly across the camera's near/far, so a scene whose screens overlap
   * needs both a wide range here and a camera that doesn't span more than it has to.
   * The canvas is its own stacking context (see Stage), so any range paints under the UI.
   */
  zIndexRange?: [number, number]
  children: ReactNode
}

export function ScreenSurface({
  worldWidth,
  pxWidth,
  pxHeight,
  occlude,
  interactive,
  radiusPx = 0,
  rotationZ = 0,
  background = '#000',
  zIndexRange = [8, 0],
  children,
}: ScreenSurfaceProps) {
  // drei's <Html transform> maps CSS pixels to three.js units as
  //   worldSize = cssPixels * (distanceFactor / 400)
  // so solve for the factor that fits the virtual viewport exactly inside the display.
  const distanceFactor = (worldWidth * 400) / pxWidth

  return (
    <group rotation-z={rotationZ}>
      <Html
        transform
        occlude={occlude as never}
        distanceFactor={distanceFactor}
        pointerEvents={interactive ? 'auto' : 'none'}
        // drei defaults this to ~16.7M; the canvas keeps the whole range to itself, so
        // the numbers only ever sort the screens against each other.
        zIndexRange={zIndexRange}
        style={{
          width: pxWidth,
          height: pxHeight,
          background,
          overflow: 'hidden',
          borderRadius: radiusPx || undefined,
          position: 'relative',
        }}
      >
        {children}
      </Html>
    </group>
  )
}
