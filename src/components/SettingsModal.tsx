import { useEffect, useRef, type ReactNode } from 'react'
import { ScenePicker } from './ScenePicker'
import { RecordPanel } from './RecordPanel'
import { CloseIcon, GridIcon, RecordIcon } from './icons'
import type { SceneConfig, SceneId, SceneSettings } from '../scenes/types'
import type { RecorderStatus } from '../hooks/useScreenRecorder'

export const SCENES_TAB = 'scenes'
export const RECORD_TAB = 'record'

interface SettingsModalProps {
  scene: SceneConfig
  settings: SceneSettings
  update: (patch: Partial<SceneSettings>) => void
  activeSceneId: SceneId
  onSelectScene: (id: SceneId) => void
  activeTab: string
  onSelectTab: (tab: string) => void
  onClose: () => void
  recorderStatus: RecorderStatus
  recorderError: string | null
  onStartRecording: () => void
  onStopRecording: () => void
}

export function SettingsModal({
  scene,
  settings,
  update,
  activeSceneId,
  onSelectScene,
  activeTab,
  onSelectTab,
  onClose,
  recorderStatus,
  recorderError,
  onStartRecording,
  onStopRecording,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const sceneTab = scene.tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <nav className="modal-rail" aria-label="Settings sections">
          <p className="rail-heading">Preview</p>
          <RailButton
            label="Scenes"
            icon={<GridIcon />}
            isActive={activeTab === SCENES_TAB}
            onClick={() => onSelectTab(SCENES_TAB)}
          />

          <p className="rail-heading">{scene.label}</p>
          {scene.tabs.map((tab) => (
            <RailButton
              key={tab.id}
              label={tab.label}
              icon={<tab.Icon />}
              isActive={activeTab === tab.id}
              onClick={() => onSelectTab(tab.id)}
            />
          ))}

          <p className="rail-heading">Output</p>
          <RailButton
            label="Record"
            icon={<RecordIcon />}
            isActive={activeTab === RECORD_TAB}
            onClick={() => onSelectTab(RECORD_TAB)}
          />
        </nav>

        <div className="modal-body">
          <header className="modal-header">
            <h2>{activeTab === SCENES_TAB ? 'Scenes' : activeTab === RECORD_TAB ? 'Record' : sceneTab?.label}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
              <CloseIcon />
            </button>
          </header>
          <div className="modal-content">
            {activeTab === SCENES_TAB && <ScenePicker activeId={activeSceneId} onSelect={onSelectScene} />}
            {activeTab === RECORD_TAB && (
              <RecordPanel
                status={recorderStatus}
                error={recorderError}
                onStart={onStartRecording}
                onStop={onStopRecording}
              />
            )}
            {sceneTab && <sceneTab.Panel settings={settings} update={update} />}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RailButtonProps {
  label: string
  icon: ReactNode
  isActive: boolean
  onClick: () => void
}

function RailButton({ label, icon, isActive, onClick }: RailButtonProps) {
  return (
    <button type="button" className={`rail-btn${isActive ? ' is-active' : ''}`} aria-current={isActive} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
