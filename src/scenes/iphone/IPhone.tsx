import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'

import { ScreenSurface } from '../../components/ScreenSurface'
import { panelGeometry, slabGeometry } from '../geometry'
import type { IPhoneSettings } from '../types'

// Virtual viewport the embedded page is laid out at — a real iPhone 15 Pro in CSS px.
const VIEWPORT_PX_W = 393
const VIEWPORT_PX_H = 852

// World units are mm/10, so the body matches the real device: 70.6 mm wide, 8.25 deep,
// with a ~10.5 mm corner radius. Height is derived from the display aspect rather than
// hard-coded, so the iframe lands inside the bezel exactly — it works out at 147.0,
// against the real device's 146.6.
const BODY_W = 7.06
const BODY_D = 0.825
const BODY_RADIUS = 1.05
const BEZEL = 0.26
/** Half-width of the rounded rail on the Z edges — also how far the flat faces are inset. */
const RAIL = 0.14

const SCREEN_W = BODY_W - BEZEL * 2
const SCREEN_H = SCREEN_W * (VIEWPORT_PX_H / VIEWPORT_PX_W)
const BODY_H = SCREEN_H + BEZEL * 2
const SCREEN_RADIUS = BODY_RADIUS - BEZEL

const FRONT_Z = BODY_D / 2
const SCREEN_RADIUS_PX = (SCREEN_RADIUS / SCREEN_W) * VIEWPORT_PX_W

const PLATEAU = 3.5
const PLATEAU_D = 0.34
const LENS_OFFSET = 0.78

export const IPHONE_BODY_HEIGHT = BODY_H

interface IPhoneProps {
  settings: IPhoneSettings
  onToggle: () => void
}

export function IPhone({ settings, onToggle }: IPhoneProps) {
  const group = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  const landscape = settings.orientation === 'landscape'
  const { screenOn, bodyColor } = settings

  const geometries = useMemo(
    () => ({
      body: slabGeometry(BODY_W, BODY_H, BODY_D, BODY_RADIUS, RAIL),
      // Both glass faces sit on the flat part of the slab, inside the rail.
      frontGlass: panelGeometry(BODY_W - RAIL * 2, BODY_H - RAIL * 2, BODY_RADIUS - RAIL),
      backGlass: panelGeometry(BODY_W - RAIL * 2 - 0.04, BODY_H - RAIL * 2 - 0.04, BODY_RADIUS - RAIL - 0.02),
      display: panelGeometry(SCREEN_W, SCREEN_H, SCREEN_RADIUS),
      plateau: slabGeometry(PLATEAU, PLATEAU, PLATEAU_D, 1.05, 0.09),
      volumeKey: slabGeometry(0.14, 1.0, 0.34, 0.07, 0.05),
      actionKey: slabGeometry(0.14, 0.52, 0.34, 0.07, 0.05),
    }),
    [],
  )

  useEffect(
    () => () => {
      for (const geometry of Object.values(geometries)) geometry.dispose()
    },
    [geometries],
  )

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const g = group.current
    // Drift more freely with the display off — that's when the body is the subject.
    // With it on, settle down so the embedded page stays readable.
    const sway = screenOn ? 0.07 : 0.24
    const roll = landscape ? -Math.PI / 2 : 0

    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, Math.cos(t / 8) * sway * 0.6, 0.08)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.sin(t / 8) * sway, 0.08)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, roll + Math.sin(t / 11) * sway * 0.3, 0.08)
    g.position.y = THREE.MathUtils.lerp(g.position.y, Math.sin(t / 1.8) * 0.22, 0.08)
  })

  return (
    <group
      ref={group}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onToggle()
      }}
      dispose={null}
    >
      {/* Brushed titanium frame. Kept short of fully metallic on purpose: at
          metalness 1 the base colour is ignored entirely and the rails just mirror
          the environment, which reads as charcoal whatever finish is selected. */}
      <mesh ref={bodyRef} geometry={geometries.body}>
        <meshStandardMaterial color={bodyColor} metalness={0.68} roughness={0.26} envMapIntensity={1.5} />
      </mesh>

      {/* Matte glass back, a touch inset so the rail reads as its own surface. */}
      <mesh geometry={geometries.backGlass} position={[0, 0, -FRONT_Z - 0.004]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={bodyColor} metalness={0.2} roughness={0.62} envMapIntensity={1.2} />
      </mesh>

      {/* Front glass — glossy black, edge to edge inside the rail. */}
      <mesh geometry={geometries.frontGlass} position={[0, 0, FRONT_Z + 0.004]}>
        <meshStandardMaterial color="#08080a" metalness={0.55} roughness={0.08} envMapIntensity={1.6} />
      </mesh>

      {/* Display panel — glossy black glass. Hidden behind the DOM overlay while the
          screen is on; with it off, this is what catches the environment. */}
      <mesh geometry={geometries.display} position={[0, 0, FRONT_Z + 0.008]}>
        <meshStandardMaterial color="#0a0a0e" metalness={0.5} roughness={0.06} envMapIntensity={2.2} />
      </mesh>

      <group position={[0, 0, FRONT_Z + 0.012]}>
        <ScreenSurface
          worldWidth={landscape ? SCREEN_H : SCREEN_W}
          pxWidth={landscape ? VIEWPORT_PX_H : VIEWPORT_PX_W}
          pxHeight={landscape ? VIEWPORT_PX_W : VIEWPORT_PX_H}
          occlude={[bodyRef]}
          interactive={screenOn}
          radiusPx={SCREEN_RADIUS_PX}
          // Cancel the body's roll so the page renders upright in world space while
          // still filling the (now landscape) display rect.
          rotationZ={landscape ? Math.PI / 2 : 0}
          background={screenOn ? '#000' : 'transparent'}
        >
          <ScreenContents url={settings.url} on={screenOn} landscape={landscape} />
        </ScreenSurface>
      </group>

      <CameraPlateau geometry={geometries.plateau} bodyColor={bodyColor} />

      {/* Action key + volume rocker on the left rail, side button on the right. */}
      <SideKey geometry={geometries.actionKey} color={bodyColor} x={-BODY_W / 2} y={3.15} />
      <SideKey geometry={geometries.volumeKey} color={bodyColor} x={-BODY_W / 2} y={1.85} />
      <SideKey geometry={geometries.volumeKey} color={bodyColor} x={-BODY_W / 2} y={0.6} />
      <SideKey geometry={geometries.volumeKey} color={bodyColor} x={BODY_W / 2} y={1.7} />
    </group>
  )
}

interface SideKeyProps {
  geometry: THREE.BufferGeometry
  color: string
  x: number
  y: number
}

function SideKey({ geometry, color, x, y }: SideKeyProps) {
  return (
    <mesh geometry={geometry} position={[x, y, 0]}>
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
    </mesh>
  )
}

interface CameraPlateauProps {
  geometry: THREE.BufferGeometry
  bodyColor: string
}

function CameraPlateau({ geometry, bodyColor }: CameraPlateauProps) {
  const lenses: [number, number][] = [
    [-LENS_OFFSET, LENS_OFFSET],
    [LENS_OFFSET, LENS_OFFSET],
    [-LENS_OFFSET, -LENS_OFFSET],
  ]

  return (
    <group position={[BODY_W / 2 - PLATEAU / 2 - 0.42, BODY_H / 2 - PLATEAU / 2 - 0.42, -FRONT_Z - PLATEAU_D / 2 + 0.03]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.4} />
      </mesh>
      {lenses.map(([x, y]) => (
        <group key={`${x},${y}`} position={[x, y, 0]}>
          {/* Metal barrel, then the lens glass sitting proud of it. */}
          <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.16, 32]} />
            <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.1, 32]} />
            <meshStandardMaterial color="#0a0a10" metalness={0.4} roughness={0.05} envMapIntensity={2} />
          </mesh>
        </group>
      ))}
      {/* Flash and LiDAR fill the fourth corner. */}
      <mesh position={[LENS_OFFSET, -LENS_OFFSET + 0.34, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
        <meshStandardMaterial color="#f3e6c8" emissive="#3a2f18" roughness={0.4} />
      </mesh>
      <mesh position={[LENS_OFFSET, -LENS_OFFSET - 0.36, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
        <meshStandardMaterial color="#101014" roughness={0.3} />
      </mesh>
    </group>
  )
}

interface ScreenContentsProps {
  url: string
  on: boolean
  landscape: boolean
}

/**
 * The display's DOM layer. The Dynamic Island and home indicator live here rather than
 * in the 3D scene because drei's <Html transform> renders in front of the canvas —
 * geometry at the same depth would be hidden behind the page.
 */
function ScreenContents({ url, on, landscape }: ScreenContentsProps) {
  const island: CSSProperties = landscape
    ? { left: 14, top: '50%', width: 36, height: 125, transform: 'translateY(-50%)' }
    : { top: 12, left: '50%', width: 125, height: 36, transform: 'translateX(-50%)' }

  const indicator: CSSProperties = landscape
    ? { right: 7, top: '50%', width: 5, height: 140, transform: 'translateY(-50%)' }
    : { bottom: 8, left: '50%', width: 140, height: 5, transform: 'translateX(-50%)' }

  return (
    // Hidden rather than unmounted while the display is off, so toggling it doesn't
    // reload the embedded page.
    <div style={{ position: 'relative', width: '100%', height: '100%', visibility: on ? 'visible' : 'hidden' }}>
      <iframe
        title="iPhone screen"
        src={url}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }}
      />
      <div style={{ position: 'absolute', borderRadius: 999, background: '#000', pointerEvents: 'none', ...island }} />
      <div
        style={{
          position: 'absolute',
          borderRadius: 999,
          // Like iOS: invert whatever sits underneath so the bar stays legible over
          // both light and dark pages. Desaturated too — a plain `difference` blend
          // would turn it cyan over a red page rather than the neutral iOS look.
          backdropFilter: 'invert(1) grayscale(1)',
          pointerEvents: 'none',
          ...indicator,
        }}
      />
    </div>
  )
}
