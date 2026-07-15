import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/I18nContext'

const MIN_HEIGHT = 120
const MAX_HEIGHT = 560
const DEFAULT_HEIGHT = 240

export default function ProgressToast({ running, lines }) {
  const t = useT()
  const bodyRef = useRef(null)
  const dragRef = useRef(null) // { startY, startHeight } während des Ziehens
  const [visible, setVisible] = useState(false)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)

  useEffect(() => {
    if (running) setVisible(true)
  }, [running])

  // Auto-scroll to bottom on new lines.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  // Auto-hide 3s after completion.
  useEffect(() => {
    if (!running && lines.length > 0) {
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
  }, [running, lines.length])

  // Resize: Handle oben am Panel, Ziehen nach oben vergrößert.
  function startDrag(e) {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startHeight: height }
    const onMove = (ev) => {
      const d = dragRef.current
      if (!d) return
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, d.startHeight + (d.startY - ev.clientY)))
      setHeight(next)
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!visible) return null

  return (
    <div className="toast" style={{ maxHeight: height }}>
      <div className="toast__resize" onMouseDown={startDrag} title="Ziehen zum Vergrößern" />
      <div className="toast__header">
        <span>{running ? t('running') : t('finished')}</span>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
      <div className="toast__body" ref={bodyRef} style={{ maxHeight: height - 60 }}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={`toast__line ${
              l.toLowerCase().includes('[warn') ? 'toast__line--warn' :
              l.toLowerCase().includes('[err') ? 'toast__line--err' : ''
            }`}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}
