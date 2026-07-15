import { useState } from 'react'
import { useT } from '../lib/I18nContext'

function driverLabel(t, status, days) {
  if (status === 'ok') return t('insightDriverOk', { n: days ?? '—' })
  if (status === 'aging') return t('insightDriverAging', { n: days ?? '—' })
  if (status === 'outdated') return t('insightDriverOld', { n: days ?? '—' })
  return t('insightDriverUnknown')
}

export default function SystemInsights({ analysis, onOpenCleaner }) {
  const t = useT()
  const [ping, setPing] = useState(null)
  const [pinging, setPinging] = useState(false)
  const [target, setTarget] = useState('1.1.1.1')

  const gpu = analysis?.gpu
  const storage = analysis?.storage

  async function runPing() {
    setPinging(true)
    setPing(null)
    try {
      const res = await window.api.networkPing(target, 4)
      setPing(res || { ok: false, error: 'no result' })
    } catch (e) {
      setPing({ ok: false, error: e.message })
    }
    setPinging(false)
  }

  if (!analysis) {
    return (
      <section className="insights-panel">
        <h2 className="tools-expert__title">{t('insightsTitle')}</h2>
        <p className="muted">{t('insightsNeedScan')}</p>
      </section>
    )
  }

  return (
    <section className="insights-panel">
      <h2 className="tools-expert__title">{t('insightsTitle')}</h2>
      <p className="tools-expert__hint">{t('insightsHint')}</p>

      <div className="insights-cards">
        <div className="insight-card">
          <div className="insight-card__k">{t('insightDriver')}</div>
          <div className="insight-card__v">
            {gpu?.primaryName || gpu?.primaryVendor || '—'}
          </div>
          <div className={`insight-card__status insight-card__status--${gpu?.primaryDriverStatus || 'unknown'}`}>
            {driverLabel(t, gpu?.primaryDriverStatus, gpu?.primaryDriverAgeDays)}
          </div>
          {gpu?.primaryDriverVersion && (
            <div className="insight-card__meta">{gpu.primaryDriverVersion}{gpu.primaryDriverDate ? ` · ${gpu.primaryDriverDate}` : ''}</div>
          )}
          <p className="insight-card__note">{t('insightDriverNote')}</p>
        </div>

        <div className="insight-card">
          <div className="insight-card__k">{t('insightDisk')}</div>
          <div className="insight-card__v">
            {storage?.freeGB != null
              ? t('insightDiskFree', { free: storage.freeGB, total: storage.totalGB ?? '—' })
              : '—'}
          </div>
          <div className="insight-card__meta">
            {t('insightTemp', { n: storage?.tempMB ?? 0 })}
            {storage?.usedPercent != null ? ` · ${storage.usedPercent}%` : ''}
          </div>
          {storage?.cleanerWorth ? (
            <button type="button" className="btn btn--small btn--primary" onClick={onOpenCleaner}>
              {t('insightCleanerCta')}
            </button>
          ) : (
            <div className="insight-card__status insight-card__status--ok">{t('insightDiskOk')}</div>
          )}
        </div>

        <div className="insight-card">
          <div className="insight-card__k">{t('insightPing')}</div>
          <div className="insight-card__row">
            <input
              className="insight-card__input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label={t('insightPingTarget')}
            />
            <button type="button" className="btn btn--small" disabled={pinging} onClick={runPing}>
              {pinging ? t('loading') : t('insightPingRun')}
            </button>
          </div>
          {ping && (
            <div className="insight-card__meta">
              {ping.ok
                ? t('insightPingResult', {
                    avg: ping.avgMs ?? '—',
                    min: ping.minMs ?? '—',
                    max: ping.maxMs ?? '—',
                    loss: ping.lossPercent ?? 0,
                  })
                : (ping.error || t('insightPingFail'))}
            </div>
          )}
          <p className="insight-card__note">{t('insightPingNote')}</p>
        </div>
      </div>
    </section>
  )
}
