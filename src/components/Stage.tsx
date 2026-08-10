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
    //
    // `isolation` makes the canvas wrapper its own stacking context. Screens are DOM
    // overlays drei stacks by depth, and without this their z-indexes would compete
    // with the cog and the settings modal in the root stacking context — so a scene
    // that needs a wide range to sort its screens would paint over the UI.
    <Canvas key={scene.id} dpr={[1, 2]} camera={scene.camera} style={{ isolation: 'isolate' }}>
      <Suspense fallback={null}>
        <Viewport settings={settings} update={update} />
      </Suspense>
    </Canvas>
  )
}
