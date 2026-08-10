import type { RecorderStatus } from '../hooks/useScreenRecorder'

interface RecordPanelProps {
  status: RecorderStatus
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function RecordPanel({ status, error, onStart, onStop }: RecordPanelProps) {
  return (
    <>
      <p className="panel-intro">
        Captures your screen or tab rather than the WebGL canvas — canvas capture can&rsquo;t see the DOM-based screen
        overlay, and cross-origin iframe pixels aren&rsquo;t readable anyway. Choose &ldquo;This Tab&rdquo; when the
        browser prompts, and close this panel first for a clean take.
      </p>
      {status === 'idle' && (
        <button type="button" className="record-btn" onClick={onStart}>
          <span className="dot" /> Start recording
        </button>
      )}
      {status === 'recording' && (
        <button type="button" className="record-btn recording" onClick={onStop}>
          <span className="dot" /> Stop recording
        </button>
      )}
      {status === 'stopping' && (
        <button type="button" className="record-btn" disabled>
          Saving…
        </button>
      )}
      <p className="hint">Downloads as a .webm when you stop.</p>
      {error && <p className="error">{error}</p>}
    </>
  )
}
