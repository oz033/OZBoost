import { useEffect, useState, useCallback } from 'react'
import Icon from './Icons'
import { usePrefs, useT } from '../lib/I18nContext'
import { THEMES, LANGS } from '../lib/i18n'
import { loadHistory, clearHistory } from '../lib/history'
import { loadTelemetry, topFailures, resetTelemetry } from '../lib/telemetry'
import { benefitLabel } from '../data/benefits'
import { TWEAKS_BY_ID } from '../data/tweaks'
import StartupPanel from './StartupPanel'

export default function SettingsPanel({
  onBackup,
  onRevertAll,
  onHistoryRevert,
  appliedCount,
  totalCount,
  revertingAll,
}) {
  const t = useT()
  const {
    theme, lang, telemetry, autoUpdate,
    setTheme, setLang, setTelemetry, setAutoUpdate,
  } = usePrefs()
  const [backups, setBackups] = useState(null)
  const [logPath, setLogPath] = useState('')
  const [history, setHistory] = useState(() => loadHistory())
  const [tel, setTel] = useState(() => loadTelemetry())
  const [version, setVersion] = useState('—')
  const [updateStatus, setUpdateStatus] = useState('idle') // idle|checking|available|none|error
  const [updateInfo, setUpdateInfo] = useState(null)
  const [revertingId, setRevertingId] = useState(null)

  const refreshMeta = useCallback(() => {
    window.api.listBackups().then((list) => setBackups(Array.isArray(list) ? list : [])).catch(() => setBackups([]))
    window.api.getLogPath().then(setLogPath).catch(() => {})
    window.api.getAppVersion?.().then(setVersion).catch(() => setVersion('—'))
    setHistory(loadHistory())
    setTel(loadTelemetry())
  }, [])

  useEffect(() => { refreshMeta() }, [refreshMeta, appliedCount])

  async function handleEntryRevert(entry) {
    if (!onHistoryRevert || !entry?.tweakId || entry.reverted) return
    setRevertingId(entry.id)
    const ok = await onHistoryRevert(entry)
    setRevertingId(null)
    setHistory(loadHistory())
    if (!ok) { /* errors shown in toast lines */ }
  }

  const snapText = (() => {
    if (backups === null) return t('loading')
    if (backups.length === 0) return t('settingsSnapshotsEmpty')
    const last = `${backups[0].tweakId} (${backups[0].ts?.slice(0, 10) || '—'})`
    return t('settingsSnapshotsCount', { n: backups.length, last })
  })()

  async function handleCheckUpdate() {
    setUpdateStatus('checking')
    setUpdateInfo(null)
    try {
      const res = await window.api.checkForUpdates?.()
      if (!res || res.error) {
        setUpdateStatus('error')
        return
      }
      if (res.updateAvailable) {
        setUpdateStatus('available')
        setUpdateInfo(res)
      } else {
        setUpdateStatus('none')
        setUpdateInfo(res)
      }
    } catch {
      setUpdateStatus('error')
    }
  }

  function labelForHistory(entry) {
    if (entry.kind === 'boost') return t('historyBoost', { intensity: entry.intensity || '—' })
    if (entry.kind === 'boost_interrupted') return t('historyBoostInterrupted')
    if (entry.kind === 'revert_all') return t('historyRevertAll')
    if (entry.kind === 'apply') return `${t('historyApply')}: ${entry.title || entry.tweakId}`
    if (entry.kind === 'revert') return `${t('historyRevert')}: ${entry.title || entry.tweakId}`
    return entry.text || entry.kind || '—'
  }

  const failures = topFailures(6)

  return (
    <div className="settings">
      <h1 className="section-heading">{t('settingsTitle')}</h1>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsAppearance')}</div>
        <div className="settings-row">
          <div className="settings-row__label">{t('settingsTheme')}</div>
          <div className="seg-control">
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                className={`seg-control__btn ${theme === th.id ? 'seg-control__btn--on' : ''}`}
                onClick={() => setTheme(th.id)}
              >
                {t(th.labelKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row__label">{t('settingsLanguage')}</div>
          <div className="seg-control">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`seg-control__btn ${lang === l.id ? 'seg-control__btn--on' : ''}`}
                onClick={() => setLang(l.id)}
              >
                {t(l.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsProtection')}</div>
        <p className="settings-card__desc">{t('settingsProtectionDesc')}</p>
        <div className="settings-row settings-row--end">
          <div className="settings-row__hint">{snapText}</div>
          <button type="button" className="btn btn--primary btn--small" onClick={onBackup}>
            <Icon name="backup" size={14} />
            {t('settingsBackup')}
          </button>
        </div>
        <div className="settings-row settings-row--end">
          <div className="settings-row__hint">{t('settingsRevertAllDesc')}</div>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={revertingAll || appliedCount === 0}
            onClick={() => {
              if (!window.confirm(t('settingsRevertAllConfirm', { n: appliedCount }))) return
              onRevertAll?.()
            }}
          >
            <Icon name="undo" size={14} />
            {revertingAll ? t('settingsRevertAllRunning') : t('settingsRevertAll')}
          </button>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsHistory')}</div>
        <p className="settings-card__desc">{t('settingsHistoryDesc')}</p>
        {history.length === 0 ? (
          <p className="muted">{t('settingsHistoryEmpty')}</p>
        ) : (
          <ul className="settings-history">
            {history.slice(0, 16).map((h) => {
              const canRevert = h.kind === 'apply' && h.tweakId && !h.reverted
                && TWEAKS_BY_ID[h.tweakId]?.actions?.revert?.length > 0
              return (
                <li key={h.id} className="settings-history__row">
                  <div className="settings-history__main">
                    <span className="settings-history__text">
                      {labelForHistory(h)}
                      {h.reverted ? ` · ${t('historyReverted')}` : ''}
                    </span>
                    <span className="settings-history__time">
                      {h.ts ? new Date(h.ts).toLocaleString() : '—'}
                    </span>
                  </div>
                  {canRevert && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={revertingId === h.id}
                      onClick={() => handleEntryRevert(h)}
                    >
                      {revertingId === h.id ? t('loading') : t('historyRevertOne')}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="settings-row settings-row--end">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={history.length === 0}
            onClick={() => setHistory(clearHistory())}
          >
            {t('settingsHistoryClear')}
          </button>
        </div>
      </section>

      <StartupPanel />

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsStats')}</div>
        <p className="settings-card__desc">
          {t('settingsStatsDesc', { applied: appliedCount, total: totalCount })}
        </p>
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsTelemetry')}</div>
        <p className="settings-card__desc">{t('settingsTelemetryDesc')}</p>
        <div className="settings-row">
          <div className="settings-row__label">{t('settingsTelemetry')}</div>
          <div className="seg-control">
            <button
              type="button"
              className={`seg-control__btn ${telemetry ? 'seg-control__btn--on' : ''}`}
              onClick={() => setTelemetry(true)}
            >
              {t('settingsTelemetryOn')}
            </button>
            <button
              type="button"
              className={`seg-control__btn ${!telemetry ? 'seg-control__btn--on' : ''}`}
              onClick={() => setTelemetry(false)}
            >
              {t('settingsTelemetryOff')}
            </button>
          </div>
        </div>
        {telemetry && (
          <>
            <p className="muted">
              {t('settingsTelemetryStats', {
                runs: tel.runs,
                fail: tel.failed,
                ok: tel.applied,
              })}
            </p>
            {failures.length > 0 && (
              <>
                <div className="settings-card__title" style={{ marginTop: 10, fontSize: 13 }}>
                  {t('settingsTelemetryTop')}
                </div>
                <ul className="settings-history">
                  {failures.map((f) => {
                    const tw = TWEAKS_BY_ID[f.id]
                    const name = benefitLabel(f.id, tw).short
                    return (
                      <li key={f.id} className="settings-history__row">
                        <span className="settings-history__text">{name}</span>
                        <span className="settings-history__time">{f.fail}×</span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            <div className="settings-row settings-row--end">
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => setTel(resetTelemetry())}
              >
                {t('settingsTelemetryReset')}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsUpdates')}</div>
        <p className="settings-card__desc">{t('settingsUpdatesDesc')}</p>
        <div className="settings-row">
          <div className="settings-row__label">Auto</div>
          <div className="seg-control">
            <button
              type="button"
              className={`seg-control__btn ${autoUpdate ? 'seg-control__btn--on' : ''}`}
              onClick={() => setAutoUpdate(true)}
            >
              {t('settingsTelemetryOn')}
            </button>
            <button
              type="button"
              className={`seg-control__btn ${!autoUpdate ? 'seg-control__btn--on' : ''}`}
              onClick={() => setAutoUpdate(false)}
            >
              {t('settingsTelemetryOff')}
            </button>
          </div>
        </div>
        <p className="muted">
          {updateStatus === 'idle' && t('settingsUpdatesIdle')}
          {updateStatus === 'checking' && t('settingsUpdatesChecking')}
          {updateStatus === 'available' && t('settingsUpdatesAvailable', { v: updateInfo?.version || '—' })}
          {updateStatus === 'none' && t('settingsUpdatesNone', { v: version })}
          {updateStatus === 'error' && t('settingsUpdatesError')}
        </p>
        <div className="settings-row settings-row--end">
          <button type="button" className="btn btn--ghost btn--small" onClick={handleCheckUpdate}>
            {t('settingsUpdatesCheck')}
          </button>
          {updateStatus === 'available' && (
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={() => window.api.downloadUpdate?.()}
            >
              {t('settingsUpdatesDownload')}
            </button>
          )}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsLog')}</div>
        <p className="settings-card__desc">{t('settingsLogDesc')}</p>
        <code className="settings-code">{logPath || '—'}</code>
      </section>

      <section className="settings-card">
        <div className="settings-card__title">{t('settingsAbout')}</div>
        <p className="settings-card__desc">{t('settingsAboutVersion', { v: version })}</p>
        <p className="settings-card__desc settings-about-credit">{t('settingsAboutMadeBy')}</p>
        <p className="settings-card__desc">{t('settingsAboutDisclaimer')}</p>
      </section>
    </div>
  )
}
