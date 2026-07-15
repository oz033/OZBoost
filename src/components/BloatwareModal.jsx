import { useMemo, useState } from 'react'
import { APPS, APP_GROUPS, SAFE_APPS } from '../data/apps'
import Icon from './Icons'
import { useT } from '../lib/I18nContext'

export default function BloatwareModal({ onClose, onRemove, running }) {
  const t = useT()
  const REC_META = {
    safe:     { label: t('bloatSafe'),     cls: 'risk-badge--low',    selectable: true },
    optional: { label: t('bloatOptional'), cls: 'risk-badge--medium', selectable: true },
    unsafe:   { label: t('bloatUnsafe'),   cls: 'risk-badge--high',   selectable: true },
  }
  const [selected, setSelected] = useState(() => new Set(SAFE_APPS.map((a) => a.id)))
  const [activeGroup, setActiveGroup] = useState('microsoft')
  const [filter, setFilter] = useState('all')

  const visibleApps = useMemo(() => {
    return APPS.filter((a) => a.group === activeGroup)
      .filter((a) => filter === 'all' || a.rec === filter)
  }, [activeGroup, filter])

  const groupedCount = useMemo(() => {
    const out = {}
    for (const g of APP_GROUPS) out[g.id] = APPS.filter((a) => a.group === g.id).length
    return out
  }, [])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllSafe() {
    setSelected(new Set(SAFE_APPS.map((a) => a.id)))
  }
  function selectNone() {
    setSelected(new Set())
  }

  const selectedCount = selected.size
  const selectedApps = APPS.filter((a) => selected.has(a.id))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()} style={{ width: 'min(920px, 95vw)' }}>
        <div className="modal__header">
          <div>
            <div className="modal__title">{t('bloatTitle')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {t('bloatSub', { sel: selectedCount, total: APPS.length })}
            </div>
          </div>
          <button className="modal__close" onClick={onClose} aria-label={t('close')}>×</button>
        </div>

        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap',
          padding: '10px 24px', borderBottom: '1px solid var(--border-subtle)',
          fontSize: 12, color: 'var(--text-secondary)',
        }}>
          <span><span className="risk-badge risk-badge--low">{t('bloatSafe')}</span> {t('bloatSafeHint')}</span>
          <span><span className="risk-badge risk-badge--medium">{t('bloatOptional')}</span> {t('bloatOptionalHint')}</span>
          <span><span className="risk-badge risk-badge--high">{t('bloatUnsafe')}</span> {t('bloatUnsafeHint')}</span>
        </div>

        <div className="modal__body" style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {APP_GROUPS.map((g) => (
              <button
                key={g.id}
                className={`btn btn--small ${activeGroup === g.id ? 'btn--primary' : 'btn--ghost'}`}
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => setActiveGroup(g.id)}
              >
                {g.label} <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{groupedCount[g.id]}</span>
              </button>
            ))}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn btn--ghost btn--small" onClick={selectAllSafe}>{t('bloatAllSafe')}</button>
              <button className="btn btn--ghost btn--small" onClick={selectNone}>{t('bloatNone')}</button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {['all', 'safe', 'optional', 'unsafe'].map((f) => (
                <button
                  key={f}
                  className={`btn btn--small ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? t('bloatAll') : f === 'safe' ? t('bloatSafe') : f === 'optional' ? t('bloatOptional') : t('bloatUnsafe')}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleApps.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: 16 }}>{t('bloatEmpty')}</div>
              ) : (
                visibleApps.map((a) => {
                  const meta = REC_META[a.rec]
                  const checked = selected.has(a.id)
                  return (
                    <label
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        background: checked ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 160ms ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(a.id)}
                        style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 550 }}>{a.name}</span>
                        {a.desc && (
                          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {a.desc}
                          </span>
                        )}
                      </span>
                      <span className={`risk-badge ${meta.cls}`}>{meta.label}</span>
                      {a.method === 'winget' && <span className="risk-badge risk-badge--medium">winget</span>}
                    </label>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedCount > 0 && `${selectedCount} Apps werden entfernt`}
          </span>
          <button className="btn btn--ghost" onClick={onClose} disabled={running}>{t('cancel')}</button>
          <button
            className="btn btn--primary"
            disabled={selectedCount === 0 || running}
            onClick={() => onRemove(selectedApps)}
          >
            {running ? t('bloatRunning') : (
              <><Icon name="trash" size={14} /> {t('bloatRemove', { n: selectedCount })}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
