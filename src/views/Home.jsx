import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { computeScore, scoreColor, scoreLabel, MODE_META } from '../lib/scoring'
import { computeReadiness, readinessSummary } from '../lib/readiness'
import { tierOf, tweaksForTab } from '../data/presets'
import { benefitLabel } from '../data/benefits'
import { TWEAKS_BY_ID } from '../data/tweaks'
import { useT } from '../lib/I18nContext'
import { deltaNum, formatDelta } from '../lib/metrics'
import Icon from '../components/Icons'
import logoUrl from '../assets/app-icon.png'

const INTENSITY = [
  { id: 'safe', color: 'var(--success)' },
  { id: 'strong', color: 'var(--warning)' },
  { id: 'experimental', color: 'var(--critical)' },
]

const TIER_LABEL = {
  safe: 'Safe',
  strong: 'Strong',
  experimental: 'Max',
}

function isApplied(id, state, liveStatus) {
  return state[id]?.status === 'applied' || liveStatus[id] === 'applied'
}

export default function Home({
  state,
  liveStatus,
  onBoostSelected,
  onApplyTweak,
  onOpenBloatware,
  onOpenCleaner,
  activity,
  boostResult,
  onDismissBoostResult,
  onAnalysisReady,
}) {
  const t = useT()
  const [phase, setPhase] = useState('idle') // idle | scanning | ready | error
  const [analysis, setAnalysis] = useState(null)
  const [score, setScore] = useState(null)
  const [checks, setChecks] = useState([])
  const [displayScore, setDisplayScore] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [intensity, setIntensity] = useState('safe')
  const [scanStep, setScanStep] = useState(0)
  const [filter, setFilter] = useState('all') // all | recommended | pending
  const [afterPanel, setAfterPanel] = useState(null)
  const [scanError, setScanError] = useState('')

  const analyze = useCallback(() => {
    setPhase('scanning')
    setScanStep(0)
    setDisplayScore(0)
    setSelected(new Set())
    setScanError('')
    let step = 0
    const labels = 6
    const iv = setInterval(() => {
      step++
      setScanStep(step)
      if (step >= labels) {
        clearInterval(iv)
        window.api.analyzeSystem().then((result) => {
          if (!result || result.error) {
            setScanError(result?.error || 'No result from analyzer')
            setPhase('error')
            return
          }
          setAnalysis(result)
          onAnalysisReady?.(result)
          const computed = computeScore(result)
          setScore(computed)
          setChecks(computeReadiness(result))
          setPhase('ready')
          animateScore(computed.score)
        }).catch((err) => {
          setScanError(err?.message || String(err))
          setPhase('error')
        })
      }
    }, 220)
  }, [onAnalysisReady])

  // After boost: show before/after panel; refresh score from after snapshot if present
  const lastBoostTs = useRef(null)
  useEffect(() => {
    if (!boostResult?.done || !boostResult?.ts) return
    if (lastBoostTs.current === boostResult.ts) return
    lastBoostTs.current = boostResult.ts
    if (boostResult.before || boostResult.after || boostResult.fails) {
      setAfterPanel({
        before: boostResult.before,
        after: boostResult.after,
        applied: boostResult.applied,
        skipped: boostResult.skipped,
        failed: boostResult.failed,
        fails: boostResult.fails || [],
      })
    }
    // Prefer after analysis for live UI
    if (boostResult.afterAnalysis && !boostResult.afterAnalysis.error) {
      setAnalysis(boostResult.afterAnalysis)
      const computed = computeScore(boostResult.afterAnalysis)
      setScore(computed)
      setChecks(computeReadiness(boostResult.afterAnalysis))
      setPhase('ready')
      animateScore(computed.score)
    } else {
      const id = setTimeout(analyze, 400)
      return () => clearTimeout(id)
    }
  }, [boostResult, analyze])

  function animateScore(target) {
    const start = Date.now()
    const duration = 900
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayScore(Math.round(target * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const statusKey = useMemo(() => {
    if (!score) return 'statusMedium'
    const s = score.score
    if (s >= 90) return 'statusExcellent'
    if (s >= 75) return 'statusGood'
    if (s >= 60) return 'statusMedium'
    if (s >= 40) return 'statusOptimizable'
    return 'statusCritical'
  }, [score])

  const scanRecIds = useMemo(() => {
    if (!score) return new Set()
    const allowed =
      intensity === 'safe' ? ['safe']
        : intensity === 'strong' ? ['safe', 'strong']
          : ['safe', 'strong', 'ultimate']
    return new Set(
      score.recommendations
        .filter((r) => allowed.includes(r.mode))
        .map((r) => r.id),
    )
  }, [score, intensity])

  const recById = useMemo(() => {
    const map = new Map()
    for (const r of score?.recommendations || []) map.set(r.id, r)
    return map
  }, [score])

  const packageItems = useMemo(() => {
    return tweaksForTab(intensity)
      .map((id) => {
        const tweak = TWEAKS_BY_ID[id]
        if (!tweak) return null
        const benefit = benefitLabel(id, tweak)
        const rec = recById.get(id)
        const tier = tierOf(id) || 'safe'
        return {
          id,
          title: benefit.short,
          desc: rec?.desc || benefit.benefit,
          tier,
          recommended: scanRecIds.has(id),
          points: rec?.points || 0,
          impact: benefit.impact || 0,
          applied: isApplied(id, state, liveStatus),
          requiresReboot: !!tweak.requiresReboot,
        }
      })
      .filter(Boolean)
  }, [intensity, recById, scanRecIds, state, liveStatus])

  const boostTotal = packageItems.length
  const boostPending = packageItems.filter((i) => !i.applied).length
  const scanPendingCount = packageItems.filter((i) => i.recommended && !i.applied).length

  const seedKeyRef = useRef(null)
  useEffect(() => {
    if (phase !== 'ready' || !score) return
    const key = `${intensity}|${score.score}|${score.recommendations?.length || 0}`
    if (seedKeyRef.current === key) return
    seedKeyRef.current = key
    setSelected(new Set(
      packageItems.filter((i) => i.recommended && !i.applied).map((i) => i.id),
    ))
  }, [phase, intensity, score, packageItems])

  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev
      const valid = new Set(packageItems.filter((i) => !i.applied).map((i) => i.id))
      let changed = false
      const next = new Set()
      for (const id of prev) {
        if (valid.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [packageItems])

  const selectedPending = useMemo(
    () => [...selected].filter((id) => !isApplied(id, state, liveStatus)),
    [selected, state, liveStatus],
  )

  const visibleItems = useMemo(() => {
    let list = packageItems
    if (filter === 'recommended') list = list.filter((i) => i.recommended)
    if (filter === 'pending') list = list.filter((i) => !i.applied)
    return [...list].sort((a, b) => {
      if (a.applied !== b.applied) return a.applied ? 1 : -1
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
      return (b.points || b.impact) - (a.points || a.impact)
    })
  }, [packageItems, filter])

  const summary = readinessSummary(checks)

  function toggle(id) {
    if (isApplied(id, state, liveStatus)) return
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function selectAllPending() {
    setSelected(new Set(packageItems.filter((i) => !i.applied).map((i) => i.id)))
  }
  function selectRecommended() {
    setSelected(new Set(packageItems.filter((i) => i.recommended && !i.applied).map((i) => i.id)))
  }
  function selectNone() { setSelected(new Set()) }

  function changeIntensity(id) {
    setIntensity(id)
  }

  function handleApplySelected() {
    if (selectedPending.length === 0) return
    onBoostSelected(selectedPending, intensity)
  }

  /* ── Idle: workbench start rail (left-biased, one CTA) ── */
  if (phase === 'idle') {
    return (
      <div className="home home--start">
        <section className="home-start">
          <div className="home-start__brand">
            <img src={logoUrl} alt="" className="home-start__logo" draggable={false} />
            <div className="home-start__copy">
              <h1 className="home-start__title">{t('homeTitle')}</h1>
              <p className="home-start__sub">{t('homeSubtitle')}</p>
            </div>
          </div>
          <button type="button" className="home-cta" onClick={analyze}>
            <Icon name="bolt" size={18} strokeWidth={2} />
            <span>{t('scan')}</span>
          </button>
          <div className="home-start__links">
            <button type="button" className="home-cta home-cta--outline" onClick={onOpenCleaner}>
              <Icon name="clean" size={16} strokeWidth={2} />
              <span>{t('quickCleaner')}</span>
            </button>
            <button type="button" className="home-cta home-cta--outline" onClick={onOpenBloatware}>
              <Icon name="trash" size={16} strokeWidth={2} />
              <span>{t('quickBloatware')}</span>
            </button>
          </div>
        </section>
      </div>
    )
  }

  /* ── Scanning ── */
  if (phase === 'scanning') {
    const pct = Math.min(100, Math.round((scanStep / 6) * 100))
    return (
      <div className="home home--start">
        <section className="home-start home-start--scan" aria-busy="true" aria-live="polite">
          <div className="home-start__brand">
            <img src={logoUrl} alt="" className="home-start__logo" draggable={false} />
            <div className="home-start__copy">
              <h1 className="home-start__title">{t('scanning')}</h1>
              <p className="home-start__sub home-start__sub--mono">{pct}%</p>
            </div>
          </div>
          <div className="home-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="home-progress__fill" style={{ width: `${pct}%` }} />
          </div>
        </section>
      </div>
    )
  }

  /* ── Error ── */
  if (phase === 'error') {
    return (
      <div className="home home--start">
        <section className="home-start">
          <div className="home-start__brand">
            <span className="home-start__err" aria-hidden>
              <Icon name="warning" size={28} />
            </span>
            <div className="home-start__copy">
              <h1 className="home-start__title">{t('scanFailed')}</h1>
              {scanError ? (
                <p className="home-start__sub" style={{ maxWidth: 420, wordBreak: 'break-word' }}>
                  {scanError}
                </p>
              ) : null}
            </div>
          </div>
          <button type="button" className="home-cta home-cta--secondary" onClick={analyze}>
            <Icon name="refresh" size={16} />
            <span>{t('retry')}</span>
          </button>
        </section>
      </div>
    )
  }

  if (!score) return null

  const color = scoreColor(score.score)

  return (
    <div className="home">
      {afterPanel && (
        <section className="home-after" aria-live="polite">
          <div className="home-after__head">
            <h2 className="home-after__title">{t('afterTitle')}</h2>
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setAfterPanel(null)
                onDismissBoostResult?.()
              }}
            >
              {t('afterDismiss')}
            </button>
          </div>
          <div className="home-after__grid">
            <div className="home-after__cell">
              <span className="home-after__k">{t('afterScore')}</span>
              <span className="home-after__v">
                {afterPanel.before?.score ?? '—'}
                <span className="home-after__arrow">→</span>
                {afterPanel.after?.score ?? '—'}
                <span className="home-after__d">
                  {formatDelta(deltaNum(afterPanel.before?.score, afterPanel.after?.score))}
                </span>
              </span>
            </div>
            <div className="home-after__cell">
              <span className="home-after__k">{t('afterRam')}</span>
              <span className="home-after__v">
                {afterPanel.before?.ramUsedPct != null ? `${afterPanel.before.ramUsedPct}%` : '—'}
                <span className="home-after__arrow">→</span>
                {afterPanel.after?.ramUsedPct != null ? `${afterPanel.after.ramUsedPct}%` : '—'}
                <span className="home-after__d">
                  {formatDelta(deltaNum(afterPanel.before?.ramUsedPct, afterPanel.after?.ramUsedPct), { suffix: '%' })}
                </span>
              </span>
            </div>
            <div className="home-after__cell">
              <span className="home-after__k">{t('afterProc')}</span>
              <span className="home-after__v">
                {afterPanel.before?.processCount ?? '—'}
                <span className="home-after__arrow">→</span>
                {afterPanel.after?.processCount ?? '—'}
                <span className="home-after__d">
                  {formatDelta(deltaNum(afterPanel.before?.processCount, afterPanel.after?.processCount))}
                </span>
              </span>
            </div>
          </div>
          <p className="home-after__batch">
            {t('afterBatch', {
              applied: afterPanel.applied ?? 0,
              skipped: afterPanel.skipped ?? 0,
              failed: afterPanel.failed ?? 0,
            })}
          </p>
          {afterPanel.fails?.length > 0 && (
            <div className="home-after__fails">
              <div className="home-after__fails-title">{t('afterFailsTitle')}</div>
              <ul className="home-after__fails-list">
                {afterPanel.fails.map((f) => (
                  <li key={f.id || f.title}>
                    <strong>{f.title || f.id}</strong>
                    {f.error ? <span className="home-after__fails-err"> — {f.error}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="home-after__note">{t('afterNote')}</p>
        </section>
      )}

      {/* Score workbench — left score, right meta + re-scan */}
      <section className="home-hero">
        <div className="home-hero__score-wrap">
          <div className="home-hero__score" style={{ borderColor: color, color }}>
            <span className="home-hero__num">{displayScore}</span>
            <span className="home-hero__max">{t('scoreOutOf')}</span>
          </div>
          <div className="home-hero__meta">
            <div className="home-hero__status" style={{ color }}>{t(statusKey)}</div>
            <div className="home-hero__hw">
              {t('hardwareLine', {
                cpu: analysis?.cpu?.vendor || '—',
                gpu: analysis?.gpu?.primaryVendor || '—',
                ram: analysis?.ram?.totalGB || '—',
                os: analysis?.os?.isWin11 ? 'Win 11' : 'Win 10',
              })}
            </div>
            {(analysis?.os?.build || analysis?.os?.version) && (
              <div className="home-hero__build">
                {t('windowsBuild', {
                  build: analysis?.os?.build ?? '—',
                  caption: analysis?.os?.version || '',
                })}
              </div>
            )}
          </div>
        </div>
        <div className="home-hero__right">
          <div className="home-metrics">
            <span className="home-metrics__note">{t('afterNote')}</span>
            {analysis?.ram?.usedPercent != null && (
              <div className="home-metric">
                <span className="home-metric__v">{analysis.ram.usedPercent}%</span>
                <span className="home-metric__l">{t('afterRam')}</span>
              </div>
            )}
            {analysis?.background?.processCount != null && (
              <div className="home-metric">
                <span className="home-metric__v">{analysis.background.processCount}</span>
                <span className="home-metric__l">{t('afterProc')}</span>
              </div>
            )}
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={analyze}>
            <Icon name="refresh" size={13} /> {t('reanalyze')}
          </button>
        </div>
      </section>

      {/* Intensity + selection scope + primary apply */}
      <section className="home-boost">
        <div className="home-boost__head">
          <span className="home-boost__label">{t('intensity')}</span>
          <div className="intensity" role="group" aria-label={t('intensity')}>
            {INTENSITY.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`intensity__btn ${intensity === opt.id ? 'intensity__btn--on' : ''}`}
                onClick={() => changeIntensity(opt.id)}
              >
                <span className="intensity__dot" style={{ background: opt.color }} />
                <span className="intensity__name">
                  {opt.id === 'safe' ? t('intensitySafe') : opt.id === 'strong' ? t('intensityStrong') : t('intensityMax')}
                </span>
                <span className="intensity__pts">{tweaksForTab(opt.id).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="home-scope">
          <div className="home-scope__item">
            <span className="home-scope__k">{t('selectedLabel')}</span>
            <span className="home-scope__v">{selectedPending.length}</span>
          </div>
          <div className="home-scope__divider" />
          <div className="home-scope__item">
            <span className="home-scope__k">{t('packageOpen')}</span>
            <span className="home-scope__v">
              {boostPending}<span className="home-scope__soft">/{boostTotal}</span>
            </span>
          </div>
          <div className="home-scope__divider" />
          <div className="home-scope__item">
            <span className="home-scope__k">{t('scanFindingsTitle')}</span>
            <span className="home-scope__v">{scanPendingCount}</span>
          </div>
        </div>
        <p className="home-scope__hint">{t('packagePickHint')}</p>

        <button
          type="button"
          className="home-cta"
          onClick={handleApplySelected}
          disabled={selectedPending.length === 0}
        >
          <Icon name="bolt" size={18} strokeWidth={2} />
          <span>{t('applySelected')}</span>
          {selectedPending.length > 0 && (
            <span className="home-cta__badge">{selectedPending.length}</span>
          )}
        </button>
        <div className="home-cta__sub">
          {t('willApplySelected', { n: selectedPending.length, total: boostPending })}
        </div>
      </section>

      {/* Compact text links — no icon-tile cards */}
      <section className="home-quick">
        <button type="button" className="home-link home-link--row" onClick={onOpenCleaner}>
          {t('quickCleaner')}
          <Icon name="chevron" size={14} />
        </button>
        <button type="button" className="home-link home-link--row" onClick={onOpenBloatware}>
          {t('quickBloatware')}
          <Icon name="chevron" size={14} />
        </button>
        {summary && (
          <div className="home-quick__stat">
            {t('readinessOk', { ok: summary.good, total: summary.total })}
            {summary.warning > 0 ? ` · ${t('readinessFix', { n: summary.warning })}` : ''}
          </div>
        )}
      </section>

      {/* Full package list */}
      <section className="home-section">
        <div className="home-section__head">
          <div>
            <h2 className="home-section__title">{t('packageListTitle')}</h2>
            <p className="home-section__hint">{t('packageListHint')}</p>
          </div>
          <div className="home-section__actions">
            <button type="button" className="btn-text" onClick={selectRecommended}>{t('selectRecommended')}</button>
            <button type="button" className="btn-text" onClick={selectAllPending}>{t('selectAllPending')}</button>
            <button type="button" className="btn-text" onClick={selectNone}>{t('selectNone')}</button>
          </div>
        </div>

        <div className="pkg-filters" role="tablist">
          {[
            { id: 'all', label: t('filterAll', { n: boostTotal }) },
            { id: 'recommended', label: t('filterRecommended', { n: scanPendingCount }) },
            { id: 'pending', label: t('filterPending', { n: boostPending }) },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`pkg-filters__btn ${filter === f.id ? 'pkg-filters__btn--on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rec-grid">
          {visibleItems.map((item) => {
            const meta = MODE_META[item.tier === 'experimental' ? 'ultimate' : item.tier] || MODE_META.safe
            const isSel = selected.has(item.id)
            return (
              <div
                key={item.id}
                className={`rec-card ${isSel ? 'rec-card--selected' : ''} ${item.applied ? 'rec-card--applied' : ''}`}
                onClick={() => !item.applied && toggle(item.id)}
              >
                <div className="rec-card__check">
                  <input
                    type="checkbox"
                    checked={isSel && !item.applied}
                    disabled={item.applied}
                    onChange={() => toggle(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="rec-card__body">
                  <div className="rec-card__title">{item.title}</div>
                  <div className="rec-card__desc">{item.desc}</div>
                  <div className="rec-card__meta">
                    {item.recommended && (
                      <span className="rec-pill rec-pill--rec">{t('recommended')}</span>
                    )}
                    <span className="rec-pill" style={{ background: meta.color + '22', color: meta.color }}>
                      {TIER_LABEL[item.tier] || item.tier}
                    </span>
                    {item.points > 0 && (
                      <span className="rec-pill rec-pill--points">+{item.points}</span>
                    )}
                    {item.requiresReboot && (
                      <span className="rec-pill">{t('reboot')}</span>
                    )}
                    {item.applied && (
                      <span className="rec-pill rec-pill--done">{t('active')}</span>
                    )}
                  </div>
                </div>
                <div className="rec-card__action">
                  {item.applied ? (
                    <span className="rec-applied-badge"><Icon name="check" size={14} strokeWidth={2.5} /></span>
                  ) : (
                    <button
                      type="button"
                      className="rec-apply-btn"
                      onClick={(e) => { e.stopPropagation(); onApplyTweak(item.id) }}
                    >
                      {t('apply')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {visibleItems.length === 0 && (
            <div className="pkg-empty">{t('packageEmpty')}</div>
          )}
        </div>
      </section>

      {selectedPending.length > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar__info">
            <span className="bulk-bar__count">{t('selected', { n: selectedPending.length })}</span>
            <span className="bulk-bar__gain">{t('ofPending', { n: boostPending })}</span>
          </div>
          <button type="button" className="bulk-apply-btn" onClick={handleApplySelected}>
            {t('applySelected')} ({selectedPending.length})
          </button>
        </div>
      )}

      <section className="home-section">
        <h2 className="home-section__title">{t('systemHealth')}</h2>
        <div className="health-grid">
          {Object.entries(score.systemStatus).map(([key, val]) => (
            <div key={key} className={`health-cell health-cell--${val}`}>
              <span className="health-cell__dot" />
              <span className="health-cell__label">{t(`health_${key}`)}</span>
            </div>
          ))}
        </div>
      </section>

      {activity?.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">{t('recentChanges')}</h2>
          <div className="activity-feed">
            {activity.slice(0, 5).map((entry, i) => (
              <div key={i} className="activity-row">
                <span className="activity-row__icon"><Icon name={entry.icon || 'bolt'} size={14} /></span>
                <span className="activity-row__text">{entry.text}</span>
                <span className="activity-row__time">{entry.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export { scoreLabel }
