import { Environment, ContactShadows } from '@react-three/drei'
import { Macbook } from './Macbook'
import type { MacbookSettings, SceneViewProps } from '../types'

export function MacbookViewport({ settings, update }: SceneViewProps<MacbookSettings>) {
  return (
    <>
      <color attach="background" args={[settings.bgColor]} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <group rotation={[0, Math.PI, 0]}>
        <Macbook
          open={settings.open}
          onToggle={() => update({ open: !settings.open })}
          screenUrl={settings.url}
        />
      </group>
      <Environment preset="city" />
      <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={1.75} far={4.5} />
    </>
  )
}
