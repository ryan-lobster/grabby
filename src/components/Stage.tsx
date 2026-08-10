import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import type { SceneConfig, SceneSettings } from '../scenes/types'

interface StageProps {
  scene: SceneConfig
  settings: SceneSettings
  update: (patch: Partial<SceneSettings>) => void
}

export function Stage({ scene, settings, update }: StageProps) {
  const { Viewport } = scene
  return (
    // Keyed on the scene so switching gets a fresh canvas: each scene brings its own
    // camera, and Canvas only reads `camera` on mount.
    <Canvas key={scene.id} dpr={[1, 2]} camera={scene.camera}>
      <Suspense fallback={null}>
        <Viewport settings={settings} update={update} />
      </Suspense>
    </Canvas>
  )
}
