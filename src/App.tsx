import { useCallback, useMemo, useState } from 'react'
import { Stage } from './components/Stage'
import { SettingsModal, SCENES_TAB, RECORD_TAB } from './components/SettingsModal'
import { CogIcon } from './components/icons'
import { useScreenRecorder } from './hooks/useScreenRecorder'
import { DEFAULT_SCENE_ID, getScene, isSceneId, readAllSettings, type AllSceneSettings } from './scenes/registry'
import { readBoolParam } from './scenes/params'
import type { SceneId, SceneSettings } from './scenes/types'

function readInitialState() {
  const params = new URLSearchParams(window.location.search)
  const sceneParam = params.get('scene')
  return {
    sceneId: isSceneId(sceneParam) ? sceneParam : DEFAULT_SCENE_ID,
    settings: readAllSettings(params),
    hideUi: readBoolParam(params, 'hideUi', false),
  }
}

function App() {
  const [initial] = useState(readInitialState)
  const [sceneId, setSceneId] = useState<SceneId>(initial.sceneId)
  const [allSettings, setAllSettings] = useState<AllSceneSettings>(initial.settings)
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState<string>(SCENES_TAB)
  const recorder = useScreenRecorder()

  const scene = getScene(sceneId)
  const settings = allSettings[sceneId]

  const update = useCallback(
    (patch: Partial<SceneSettings>) => {
      setAllSettings((current) => ({ ...current, [sceneId]: { ...current[sceneId], ...patch } }))
    },
    [sceneId],
  )

  // Scenes don't share a tab set, so fall back to the picker when the current tab
  // doesn't exist in the scene we just switched to.
  const activeTab = useMemo(() => {
    if (tab === SCENES_TAB || tab === RECORD_TAB) return tab
    return scene.tabs.some((sceneTab) => sceneTab.id === tab) ? tab : SCENES_TAB
  }, [tab, scene])

  return (
    <div className="app">
      <Stage scene={scene} settings={settings} update={update} />

      {!initial.hideUi && (
        <>
          <button
            type="button"
            className="settings-cog"
            aria-label="Settings"
            aria-expanded={modalOpen}
            onClick={() => setModalOpen(true)}
          >
            <CogIcon />
          </button>

          {modalOpen && (
            <SettingsModal
              scene={scene}
              settings={settings}
              update={update}
              activeSceneId={sceneId}
              onSelectScene={setSceneId}
              activeTab={activeTab}
              onSelectTab={setTab}
              onClose={() => setModalOpen(false)}
              recorderStatus={recorder.status}
              recorderError={recorder.error}
              onStartRecording={recorder.start}
              onStopRecording={recorder.stop}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
