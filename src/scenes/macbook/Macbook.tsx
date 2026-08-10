import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

import { ScreenSurface } from '../../components/ScreenSurface'
import modelUrl from '../../assets/mac-draco.glb?url'

const HINGE_CLOSED = 1.575
const HINGE_OPEN = -0.425

// Measured from the "screen.001" mesh's bounding box (in its own local/object
// space), then converted into the hinge group's local frame by applying the
// "screen" node's own transform: rotate 90° about X (y'=-z, z'=y), then
// translate by the node's position (0, 2.9646, -0.1303).
const SCREEN_CENTER: [number, number, number] = [0, 3.053, -0.092]
const SCREEN_WIDTH = 8.3
const SCREEN_HEIGHT = 5.37

const IFRAME_PX_WIDTH = 1280
const IFRAME_PX_HEIGHT = Math.round(IFRAME_PX_WIDTH * (SCREEN_HEIGHT / SCREEN_WIDTH))

type LaptopNodes = {
  Cube008: THREE.Mesh
  Cube008_1: THREE.Mesh
  Cube008_2: THREE.Mesh
  keyboard: THREE.Mesh
  Cube002: THREE.Mesh
  Cube002_1: THREE.Mesh
  touchbar: THREE.Mesh
}

type LaptopMaterials = {
  aluminium: THREE.Material
  ['matte.001']: THREE.Material
  ['screen.001']: THREE.Material
  keys: THREE.Material
  trackpad: THREE.Material
  touchbar: THREE.Material
}

interface MacbookProps {
  open: boolean
  onToggle: () => void
  screenUrl: string
}

export function Macbook({ open, onToggle, screenUrl }: MacbookProps) {
  const group = useRef<THREE.Group>(null!)
  const hingeGroup = useRef<THREE.Group>(null!)
  const hingeAngle = useRef(HINGE_CLOSED)
  const lidBackRef = useRef<THREE.Mesh>(null!)
  const lidBezelRef = useRef<THREE.Mesh>(null!)
  const { nodes, materials } = useGLTF(modelUrl) as unknown as {
    nodes: LaptopNodes
    materials: LaptopMaterials
  }
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const g = group.current
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, open ? Math.cos(t / 10) / 10 + 0.25 : 0, 0.1)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, open ? Math.sin(t / 10) / 4 : 0, 0.1)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, open ? Math.sin(t / 10) / 10 : 0, 0.1)
    g.position.y = THREE.MathUtils.lerp(g.position.y, open ? (-2 + Math.sin(t)) / 3 : -4.3, 0.1)

    hingeAngle.current = THREE.MathUtils.lerp(hingeAngle.current, open ? HINGE_OPEN : HINGE_CLOSED, 0.1)
    hingeGroup.current.rotation.x = hingeAngle.current
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
  }
  const handlePointerOut = () => setHovered(false)
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <group
      ref={group}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      dispose={null}
    >
      <group ref={hingeGroup} rotation-x={HINGE_CLOSED} position={[0, -0.04, 0.41]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={lidBackRef} material={materials.aluminium} geometry={nodes.Cube008.geometry} />
          <mesh ref={lidBezelRef} material={materials['matte.001']} geometry={nodes.Cube008_1.geometry} />
          <mesh material={materials['screen.001']} geometry={nodes.Cube008_2.geometry} />
        </group>
        <group position={SCREEN_CENTER}>
          <ScreenSurface
            worldWidth={SCREEN_WIDTH}
            pxWidth={IFRAME_PX_WIDTH}
            pxHeight={IFRAME_PX_HEIGHT}
            occlude={[lidBackRef, lidBezelRef]}
            interactive={open}
          >
            <iframe
              title="MacBook screen"
              src={screenUrl}
              width={IFRAME_PX_WIDTH}
              height={IFRAME_PX_HEIGHT}
              style={{ border: 'none', display: 'block' }}
            />
          </ScreenSurface>
        </group>
      </group>
      <mesh material={materials.keys} geometry={nodes.keyboard.geometry} position={[1.79, 0, 3.45]} />
      <group position={[0, -0.1, 3.39]}>
        <mesh material={materials.aluminium} geometry={nodes.Cube002.geometry} />
        <mesh material={materials.trackpad} geometry={nodes.Cube002_1.geometry} />
      </group>
      <mesh material={materials.touchbar} geometry={nodes.touchbar.geometry} position={[0, -0.03, 1.2]} />
    </group>
  )
}

useGLTF.preload(modelUrl)
