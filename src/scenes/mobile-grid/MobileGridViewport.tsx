import { Environment } from '@react-three/drei'
import { MobileGrid } from './MobileGrid'
import type { MobileGridSettings, SceneViewProps } from '../types'

export function MobileGridViewport({ settings }: SceneViewProps<MobileGridSettings>) {
  return (
    <>
      <color attach="background" args={[settings.bgColor]} />
      {/* Flatter than the single-device scenes: the wall faces the camera head on,
          so a strong key just blows out the middle of it. */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 12]} intensity={1.5} />
      <directionalLight position={[-8, -6, 8]} intensity={0.6} color="#a8bcff" />
      <MobileGrid settings={settings} />
      <Environment preset="city" environmentIntensity={1.1} />
    </>
  )
}
