import { macbookScene } from './macbook'
import { iphoneScene } from './iphone'
import { mobileGridScene } from './mobile-grid'
import type { SceneConfig, SceneId, SceneSettings } from './types'

/** Order here is the order of the tiles in the scene picker. */
export const SCENES: SceneConfig[] = [macbookScene, iphoneScene, mobileGridScene]

export const DEFAULT_SCENE_ID: SceneId = 'macbook'

export function getScene(id: SceneId): SceneConfig {
  return SCENES.find((scene) => scene.id === id) ?? SCENES[0]
}

export function isSceneId(value: string | null): value is SceneId {
  return value !== null && SCENES.some((scene) => scene.id === value)
}

export type AllSceneSettings = Record<SceneId, SceneSettings>

/** Every scene's settings, seeded from its defaults and any deep-link overrides. */
export function readAllSettings(params: URLSearchParams): AllSceneSettings {
  return Object.fromEntries(
    SCENES.map((scene) => [scene.id, scene.fromParams(params, scene.defaults)]),
  ) as AllSceneSettings
}
