import { useCallback, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'stopping'

const CANDIDATE_MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function pickMimeType(): string | undefined {
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laptop-preview-${Date.now()}.webm`
  link.click()
  URL.revokeObjectURL(url)
}

export function useScreenRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const start = useCallback(async () => {
    if (recorderRef.current) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      })
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        downloadBlob(new Blob(chunks, { type: 'video/webm' }))
        stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        setStatus('idle')
      }
      // The browser's own "Stop sharing" control ends the track directly.
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (recorder.state !== 'inactive') recorder.stop()
      })

      recorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch (err) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        setError(err.message)
      }
    }
  }, [])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      setStatus('stopping')
      recorder.stop()
    }
  }, [])

  return { status, error, start, stop }
}
