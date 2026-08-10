import { SCENES } from '../scenes/registry'
import { CheckIcon } from './icons'
import type { SceneId } from '../scenes/types'

interface ScenePickerProps {
  activeId: SceneId
  onSelect: (id: SceneId) => void
}

export function ScenePicker({ activeId, onSelect }: ScenePickerProps) {
  return (
    <>
      <p className="panel-intro">
        Each scene keeps its own settings — swapping between them doesn&rsquo;t disturb the other&rsquo;s setup.
      </p>
      <div className="scene-grid">
        {SCENES.map((scene) => {
          const isActive = scene.id === activeId
          return (
            <button
              key={scene.id}
              type="button"
              className={`scene-tile${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onSelect(scene.id)}
            >
              <span className="scene-thumb">
                <img src={scene.thumbnail} alt="" loading="lazy" />
                {isActive && (
                  <span className="scene-check">
                    <CheckIcon />
                  </span>
                )}
              </span>
              <span className="scene-meta">
                <span className="scene-name">{scene.label}</span>
                <span className="scene-blurb">{scene.blurb}</span>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
