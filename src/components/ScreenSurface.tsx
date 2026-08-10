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
        // drei defaults this to ~16.7M, which would paint the screen over the
        // settings modal. Keep the overlay above the canvas but below the UI.
        zIndexRange={[8, 0]}
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
