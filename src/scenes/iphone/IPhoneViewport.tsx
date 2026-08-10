import { Environment, ContactShadows } from '@react-three/drei'
import { IPhone, IPHONE_BODY_HEIGHT } from './IPhone'
import type { IPhoneSettings, SceneViewProps } from '../types'

export function IPhoneViewport({ settings, update }: SceneViewProps<IPhoneSettings>) {
  return (
    <>
      <color attach="background" args={[settings.bgColor]} />
      {/* Key light plus a cool rim — the titanium rails only read as metal if there's
          something bright for them to catch along the edges. Directional rather than
          point lights, so the intensity doesn't fall off over the camera distance. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 12, 10]} intensity={2.4} />
      <directionalLight position={[-10, -4, 6]} intensity={0.9} color="#a8bcff" />
      <IPhone settings={settings} onToggle={() => update({ screenOn: !settings.screenOn })} />
      {/* Turned up: at default intensity the city HDRI leaves a polished body looking
          like charcoal whichever finish is picked. */}
      <Environment preset="city" environmentIntensity={1.5} />
      <ContactShadows
        position={[0, -IPHONE_BODY_HEIGHT / 2 - 0.9, 0]}
        opacity={0.35}
        scale={26}
        blur={2.2}
        far={6}
      />
    </>
  )
}
