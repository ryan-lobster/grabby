import { Environment } from '@react-three/drei'
import { MobileSphere } from './MobileSphere'
import type { MobileSphereSettings, SceneViewProps } from '../types'

export function MobileSphereViewport({ settings, update }: SceneViewProps<MobileSphereSettings>) {
  return (
    <>
      <color attach="background" args={[settings.bgColor]} />
      {/* Two keys from opposite sides: the screens face every which way, so a single
          light would leave whole faces of the sphere flat. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 14]} intensity={1.4} />
      <directionalLight position={[-10, -6, 6]} intensity={0.7} color="#a8bcff" />
      <MobileSphere settings={settings} update={update} />
      <Environment preset="city" environmentIntensity={1.1} />
    </>
  )
}
