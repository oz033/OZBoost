import { useCallback, useEffect, useState } from 'react'
import { useT } from '../lib/I18nContext'

export default function StartupPanel() {
  const t = useT()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.listStartup()
      if (res?.error && !res.items) {
        setError(res.error)
        setItems([])
      } else {
        setItems(Array.isArray(res?.items) ? res.items : [])
        if (res?.ok === false && res.error) setError(res.error)
      }
    } catch (e) {
      setError(e.message || 'failed')
      setItems([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function toggle(item) {
    if (!item?.name || busy) return
    setBusy(item.name)
    try {
      const res = await window.api.setStartup(item.name, !item.enabled)
      if (res?.items) setItems(res.items)
      if (res?.ok === false && res.error) setError(res.error)
    } catch (e) {
      setError(e.message || 'failed')
    }
    setBusy(null)
  }

  return (
    <section className="settings-card">
      <div className="settings-card__title">{t('startupTitle')}</div>
      <p className="settings-card__desc">{t('startupDesc')}</p>
      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="settings-card__desc" style={{ color: 'var(--critical)' }}>{error}</p>}
      {!loading && items.length === 0 && !error && (
        <p className="muted">{t('startupEmpty')}</p>
      )}
      {!loading && items.length > 0 && (
        <ul className="settings-history startup-list">
          {items.map((it) => (
            <li key={it.id || it.name} className="settings-history__row startup-list__row">
              <div className="startup-list__body">
                <span className="settings-history__text">{it.name}</span>
                <span className="startup-list__cmd" title={it.command}>{it.command}</span>
              </div>
              <button
                type="button"
                className={`btn btn--small ${it.enabled ? 'btn--ghost' : 'btn--primary'}`}
                disabled={busy === it.name}
                onClick={() => toggle(it)}
              >
                {busy === it.name
                  ? t('loading')
                  : it.enabled
                    ? t('startupDisable')
                    : t('startupEnable')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="settings-row settings-row--end">
        <button type="button" className="btn btn--ghost btn--small" onClick={refresh} disabled={loading}>
          {t('reanalyze')}
        </button>
      </div>
    </section>
  )
}
