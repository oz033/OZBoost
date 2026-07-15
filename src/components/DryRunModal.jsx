import { useEffect, useState } from 'react'

export default function DryRunModal({ tweak, action, onClose, onConfirm }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api.previewTweak({ action, actions: tweak.actions[action] }).then((res) => {
      if (cancelled) return
      setPreview(res)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [tweak, action])

  const isHighRisk = tweak.risk === 'high'
  const canConfirm = !isHighRisk || confirmed

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <div className="modal__title">
              {action === 'apply' ? 'Anwenden' : 'Revert'}: {tweak.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Vorschau — nichts wird geändert, bis du bestätigst
            </div>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="modal__body">
          {isHighRisk && (
            <div className="warning-box">
              <strong>Hochriskant.</strong> Dieser Tweak greift tief ins System ein.
              {tweak.requiresSecureBootOff && ' Secure Boot muss deaktiviert sein.'}
              {tweak.requiresTamperOff && ' Tamper Protection muss in Windows Security aus sein.'}
              {tweak.requiresReboot && ' Wirkt erst nach Neustart.'}
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Lade Vorschau…</div>
          ) : (
            <div className="preview-list">
              {preview.items.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Keine Aktionen für diesen Schritt.</div>
              ) : (
                preview.items.map((it, i) => (
                  <div className="preview-item" key={i}>
                    <span className="preview-item__kind">{it.kind}</span>
                    <span className="preview-item__label">{it.label}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {isHighRisk && (
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Ich verstehe die Risiken und möchte fortfahren.
            </label>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
          <button
            className="btn btn--primary"
            disabled={!canConfirm || loading || preview?.items.length === 0}
            onClick={() => onConfirm()}
          >
            {action === 'apply' ? 'Anwenden' : 'Revert'}
          </button>
        </div>
      </div>
    </div>
  )
}
