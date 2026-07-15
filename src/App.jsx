import { useEffect, useMemo, useState, useCallback } from 'react'
import Home from './views/Home'
import Tools from './views/Tools'
import SystemCleaner from './components/SystemCleaner'
import DryRunModal from './components/DryRunModal'
import BloatwareModal from './components/BloatwareModal'
import CommandPalette from './components/CommandPalette'
import ProgressToast from './components/ProgressToast'
import SettingsPanel from './components/SettingsPanel'
import Icon from './components/Icons'
import { PrefsProvider, useT, usePrefs } from './lib/I18nContext'
import logoUrl from './assets/app-icon.png'
import { TWEAKS, TWEAKS_BY_ID } from './data/tweaks'
import { tweaksForTab } from './data/presets'
import { benefitLabel } from './data/benefits'
import { optimize, optimizeAll, revert } from './lib/optimizer'
import { log } from './lib/logging'
import { pushHistory, markHistoryReverted } from './lib/history'
import { recordBatch } from './lib/telemetry'
import { snapshotFromAnalysis } from './lib/metrics'
import { loadPending, setPending, clearPending } from './lib/pending'
import Splash from './components/Splash'

const NAV = [
  { id: 'home',     icon: 'dashboard', labelKey: 'navHome' },
  { id: 'cleaner',  icon: 'clean',     labelKey: 'navCleaner' },
  { id: 'tools',    icon: 'sliders',   labelKey: 'navTools' },
  { id: 'settings', icon: 'settings',  labelKey: 'navSettings' },
]

function AppInner() {
  const t = useT()
  const { telemetry, autoUpdate, theme, lang, setTheme, setLang } = usePrefs()
  const [nav, setNav] = useState('home')
  const [state, setState] = useState({})
  const [liveStatus, setLiveStatus] = useState({})
  const [modal, setModal] = useState(null)
  const [boostOpen, setBoostOpen] = useState(null)
  const [bloatwareOpen, setBloatwareOpen] = useState(false)
  const [running, setRunning] = useState(null)
  const [lines, setLines] = useState([])
  const [activity, setActivity] = useState([])
  const [homeKey, setHomeKey] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [boostResult, setBoostResult] = useState(null)
  const [revertingAll, setRevertingAll] = useState(false)
  const [splash, setSplash] = useState(true)
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [updateBanner, setUpdateBanner] = useState(null)
  const [interrupted, setInterrupted] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 1000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => { window.api.loadState().then(setState) }, [])

  // Crash-safe: leftover pending boost from a previous crash.
  useEffect(() => {
    const p = loadPending()
    if (p?.kind === 'boost') {
      setInterrupted(p)
      pushHistory({
        kind: 'boost_interrupted',
        intensity: p.intensity,
        ids: p.ids,
        startedAt: p.startedAt,
      })
      clearPending()
    }
  }, [])

  useEffect(() => {
    if (!autoUpdate) return undefined
    let cancelled = false
    window.api.checkForUpdates?.()
      .then((res) => {
        if (cancelled || !res || res.error || !res.updateAvailable) return
        setUpdateBanner({ version: res.version || '—' })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [autoUpdate])

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= String(NAV.length)) {
        e.preventDefault()
        setNav(NAV[Number(e.key) - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function logActivity(text, icon, tweakId) {
    setActivity((prev) => [{ text, icon, tweakId, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20))
  }

  async function refreshLiveStatus() {
    try {
      const payload = TWEAKS.map((tw) => ({ id: tw.id, actions: tw.actions.apply || [] }))
      const out = await window.api.getAllStatuses(payload)
      setLiveStatus(out || {})
    } catch (err) {
      log.warn(`Status-Check fehlgeschlagen: ${err.message}`)
    }
  }
  useEffect(() => { refreshLiveStatus() }, [])

  useEffect(() => {
    return window.api.onTweakLog(({ line }) => setLines((prev) => [...prev, line]))
  }, [])

  const appliedCount = useMemo(
    () => Object.values(state).filter((s) => s.status === 'applied').length,
    [state],
  )

  // Apply an explicit list of tweak IDs (user selection from Home).
  async function handleBoostIds(ids, intensity = 'safe') {
    setBoostOpen(null)
    setBoostResult(null)
    const list = (ids || []).filter(Boolean)
    if (list.length === 0) return

    setRunning('boost:selected')
    setLines([])
    setPending({ kind: 'boost', intensity, ids: list })

    // Max / experimental: force System Restore Point first.
    if (intensity === 'experimental') {
      setLines((prev) => [...prev, '[boost] Creating restore point (Max)…'])
      try {
        const rp = await window.api.createBackup('OZBoost before Max')
        if (rp?.exitCode !== 0) {
          setLines((prev) => [...prev, `[error] Restore point failed — Max aborted (${rp?.error || rp?.exitCode})`])
          clearPending()
          setRunning(null)
          return
        }
        setLines((prev) => [...prev, '[boost] Restore point OK'])
      } catch (e) {
        setLines((prev) => [...prev, `[error] Restore point failed — Max aborted (${e.message})`])
        clearPending()
        setRunning(null)
        return
      }
    }

    let beforeSnap = { ok: false }
    let beforeAnalysis = null
    try {
      beforeAnalysis = await window.api.analyzeSystem()
      beforeSnap = snapshotFromAnalysis(beforeAnalysis)
    } catch { /* continue without before */ }

    const allTweaks = list.map((id) => TWEAKS_BY_ID[id]).filter(Boolean)
    const batch = await optimizeAll(allTweaks, { state, liveStatus }, {
      onProgress: (_i, _total, r) => {
        setLines((prev) => [...prev,
          r.applied ? `[boost] OK ${r.tweakId || ''} (${r.durationMs}ms)` :
          r.skipped ? `[boost] skip ${r.tweakId} — ${r.reason}` :
          `[boost] fail ${r.tweakId} — ${r.error}`,
        ])
      },
    })

    let afterSnap = { ok: false }
    let afterAnalysis = null
    try {
      afterAnalysis = await window.api.analyzeSystem()
      afterSnap = snapshotFromAnalysis(afterAnalysis)
    } catch { /* ignore */ }

    const failList = (batch.results || [])
      .filter((r) => !r.ok && !r.skipped)
      .map((r) => ({
        id: r.tweakId,
        title: benefitLabel(r.tweakId, TWEAKS_BY_ID[r.tweakId]).short,
        error: r.error || 'failed',
      }))

    logActivity(`Boost (${intensity}): ${batch.applied} / ${batch.skipped}`, 'bolt')
    pushHistory({
      kind: 'boost',
      intensity,
      applied: batch.applied,
      skipped: batch.skipped,
      failed: batch.failed,
      fails: failList,
      before: beforeSnap,
      after: afterSnap,
    })
    for (const r of batch.results || []) {
      if (r.applied) {
        pushHistory({
          kind: 'apply',
          tweakId: r.tweakId,
          title: benefitLabel(r.tweakId, TWEAKS_BY_ID[r.tweakId]).short,
        })
      }
    }
    recordBatch(batch.results || [], { enabled: telemetry })

    const ts = Date.now()
    clearPending()
    if (afterAnalysis && !afterAnalysis.error) setLastAnalysis(afterAnalysis)
    setBoostResult({
      done: true,
      ts,
      ...batch,
      fails: failList,
      before: beforeSnap,
      after: afterSnap,
      afterAnalysis,
    })
    setRunning(null)
    const fresh = await window.api.loadState()
    setState(fresh)
    setTimeout(() => { refreshLiveStatus() }, 800)
  }

  async function handleHistoryRevert(entry) {
    if (!entry?.tweakId || entry.reverted) return false
    const tweak = TWEAKS_BY_ID[entry.tweakId]
    if (!tweak?.actions?.revert?.length) return false
    setRunning(entry.tweakId)
    setLines([])
    const result = await revert(tweak)
    setRunning(null)
    const fresh = await window.api.loadState()
    setState(fresh)
    setTimeout(() => { refreshLiveStatus() }, 500)
    if (result.ok) {
      markHistoryReverted(entry.id)
      pushHistory({
        kind: 'revert',
        tweakId: entry.tweakId,
        title: entry.title || benefitLabel(entry.tweakId, tweak).short,
      })
      logActivity(`${entry.title || entry.tweakId} revert`, 'undo', entry.tweakId)
      return true
    }
    setLines((prev) => [...prev, `[error] ${entry.tweakId}: ${result.error || 'revert failed'}`])
    return false
  }

  async function handleRevertAll() {
    const ids = Object.entries(state)
      .filter(([, s]) => s?.status === 'applied')
      .map(([id]) => id)
    const tweaks = ids.map((id) => TWEAKS_BY_ID[id]).filter((tw) => tw?.actions?.revert?.length)
    if (tweaks.length === 0) return

    setRevertingAll(true)
    setRunning('revert:all')
    setLines([])
    const results = []
    for (const tweak of tweaks) {
      const r = await revert(tweak)
      results.push({ tweakId: tweak.id, ...r })
      setLines((prev) => [...prev, r.ok
        ? `[revert] OK ${tweak.id}`
        : `[revert] fail ${tweak.id} — ${r.error || ''}`,
      ])
    }
    pushHistory({ kind: 'revert_all', count: results.filter((r) => r.ok).length })
    recordBatch(results, { enabled: telemetry })
    logActivity(`Revert all: ${results.filter((r) => r.ok).length}`, 'undo')
    setRevertingAll(false)
    setRunning(null)
    const fresh = await window.api.loadState()
    setState(fresh)
    setTimeout(() => { refreshLiveStatus() }, 600)
  }

  const runSafeBoostFromTray = useCallback(async () => {
    setNav('home')
    const ids = tweaksForTab('safe')
    setBoostOpen({ ids, intensity: 'safe' })
  }, [])

  useEffect(() => {
    if (!window.api.onTrayAction) return undefined
    return window.api.onTrayAction((action) => {
      if (action === 'show' || action === 'focus') return
      if (action === 'home') setNav('home')
      if (action === 'cleaner') setNav('cleaner')
      if (action === 'safe-boost') runSafeBoostFromTray()
      if (action === 'quick-clean') setNav('cleaner')
    })
  }, [runSafeBoostFromTray])

  function openSelectedBoost(ids, intensity) {
    setBoostOpen({ ids, intensity })
  }

  const expertTweaks = useMemo(() => {
    const ids = tweaksForTab('experimental')
    return ids.map((id) => TWEAKS_BY_ID[id]).filter(Boolean)
  }, [])

  function handleToggle(tweak, action) { setModal({ tweak, action }) }
  function handlePreview(tweak) {
    const action = state[tweak.id]?.status === 'applied' ? 'revert' : 'apply'
    setModal({ tweak, action })
  }

  async function handleConfirm() {
    if (!modal) return
    const { tweak, action } = modal
    setModal(null)
    setRunning(tweak.id)
    setLines([])

    const result = action === 'apply'
      ? await optimize(tweak, { state, liveStatus })
      : await revert(tweak, { state, liveStatus })

    setRunning(null)
    const fresh = await window.api.loadState()
    setState(fresh)
    setTimeout(() => { refreshLiveStatus() }, 600)

    if (result.ok) {
      logActivity(`${tweak.title} ${action === 'apply' ? 'OK' : 'revert'}`,
        action === 'apply' ? 'check' : 'undo', tweak.id)
      pushHistory({
        kind: action === 'apply' ? 'apply' : 'revert',
        tweakId: tweak.id,
        title: benefitLabel(tweak.id, tweak).short,
      })
      recordBatch([{ tweakId: tweak.id, ...result }], { enabled: telemetry })
    } else if (result.error) {
      setLines((prev) => [...prev, `[error] ${tweak.title}: ${result.error}`])
      recordBatch([{ tweakId: tweak.id, ok: false, error: result.error }], { enabled: telemetry })
    }
  }

  function handleBackup() {
    setRunning('backup')
    setLines([])
    window.api.createBackup('OZBoost manual').then((r) => {
      setRunning(null)
      if (r.exitCode !== 0) setLines((p) => [...p, '[error] Backup failed'])
      else logActivity('Backup', 'backup')
    })
  }

  async function handleRemoveBloatware(apps) {
    setBloatwareOpen(false)
    setRunning('bloatware')
    setLines([])
    const result = await window.api.removeBloatware(apps)
    setRunning(null)
    if (result.exitCode === 0) {
      logActivity(`Bloatware: ${apps.length}`, 'trash')
      log.success(`Bloatware: ${apps.length}`)
    } else {
      log.error(`Bloatware failed: ${result.error || 'Exit ' + result.exitCode}`)
      setLines((prev) => [...prev, `[error] Bloatware failed`])
    }
  }

  async function handleApplyTweak(tweakId) {
    const tweak = TWEAKS_BY_ID[tweakId]
    if (!tweak) return
    setRunning(tweakId)
    setLines([])

    const result = await optimize(tweak, { state, liveStatus })
    setRunning(null)

    const fresh = await window.api.loadState()
    setState(fresh)
    setTimeout(() => { refreshLiveStatus() }, 500)

    if (result.applied) {
      logActivity(`${tweak.title}`, 'check', tweakId)
      pushHistory({ kind: 'apply', tweakId, title: benefitLabel(tweakId, tweak).short })
      recordBatch([{ tweakId, ...result }], { enabled: telemetry })
    } else if (result.skipped) {
      logActivity(`${tweak.title} skip`, 'skip', tweakId)
    } else if (result.error) {
      setLines((prev) => [...prev, `[error] ${tweak.title}: ${result.error}`])
      recordBatch([{ tweakId, ok: false, error: result.error }], { enabled: telemetry })
    }
  }

  const paletteCommands = {
    static: [
      ...NAV.map((n, i) => ({
        id: `nav:${n.id}`,
        icon: n.icon,
        label: t(n.labelKey),
        hint: `Ctrl+${i + 1}`,
        group: t('groupNav'),
        run: () => setNav(n.id),
      })),
      { id: 'act:backup', icon: 'backup', label: t('actBackup'), group: t('groupActions'), run: handleBackup },
      { id: 'act:analyze', icon: 'refresh', label: t('actAnalyze'), group: t('groupActions'), run: () => { setNav('home'); setHomeKey((k) => k + 1) } },
      { id: 'act:boost-safe', icon: 'bolt', label: t('actBoostSafe'), group: t('groupActions'), run: () => setNav('home') },
      { id: 'act:boost-strong', icon: 'bolt', label: t('actBoostStrong'), group: t('groupActions'), run: () => setNav('home') },
      { id: 'act:bloatware', icon: 'trash', label: t('actBloatware'), group: t('groupActions'), run: () => { setNav('tools'); setBloatwareOpen(true) } },
    ],
    openTweak: (tweak) => {
      const action = state[tweak.id]?.status === 'applied' ? 'revert' : 'apply'
      setModal({ tweak, action })
    },
  }

  return (
    <div className="app-v9">
      <Splash visible={splash} />

      {updateBanner && (
        <div className="update-banner" role="status">
          <span>{t('updateBannerText', { v: updateBanner.version })}</span>
          <div className="update-banner__actions">
            <button type="button" className="btn btn--small btn--primary" onClick={() => window.api.downloadUpdate?.()}>
              {t('settingsUpdatesDownload')}
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={() => setUpdateBanner(null)}>
              {t('updateBannerLater')}
            </button>
          </div>
        </div>
      )}

      {interrupted && (
        <div className="update-banner update-banner--warn" role="alert">
          <span>{t('interruptedBoost', { intensity: interrupted.intensity || '—' })}</span>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setInterrupted(null)}>
            {t('close')}
          </button>
        </div>
      )}

      <header className="titlebar">
        <div className="titlebar__left">
          <span className="titlebar__logo" aria-hidden>
            <img src={logoUrl} alt="" className="titlebar__logo-img" />
          </span>
          <span className="titlebar__title">{t('appName')}</span>
        </div>

        <button
          type="button"
          className="titlebar__search"
          onClick={() => setPaletteOpen(true)}
          aria-label={`${t('search')} Ctrl+K`}
        >
          <Icon name="search" size={14} />
          <span className="titlebar__search-label">{t('search')}</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="titlebar__right">
          <div className="titlebar__seg" role="group" aria-label={t('settingsLanguage')}>
            <button
              type="button"
              className={`titlebar__seg-btn ${lang === 'de' ? 'titlebar__seg-btn--on' : ''}`}
              onClick={() => setLang('de')}
            >
              DE
            </button>
            <button
              type="button"
              className={`titlebar__seg-btn ${lang === 'en' ? 'titlebar__seg-btn--on' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
          <div className="titlebar__seg" role="group" aria-label={t('settingsTheme')}>
            <button
              type="button"
              className={`titlebar__seg-btn ${theme !== 'light' ? 'titlebar__seg-btn--on' : ''}`}
              onClick={() => setTheme('dark')}
              title={t('themeDark')}
              aria-label={t('themeDark')}
            >
              <Icon name="moon" size={14} />
            </button>
            <button
              type="button"
              className={`titlebar__seg-btn ${theme === 'light' ? 'titlebar__seg-btn--on' : ''}`}
              onClick={() => setTheme('light')}
              title={t('themeLight')}
              aria-label={t('themeLight')}
            >
              <Icon name="sun" size={14} />
            </button>
          </div>
        </div>
      </header>

      <aside className="sidebar-v9" aria-label={t('appName')}>
        <div className="sidebar-v9__logo" aria-hidden>
          <img src={logoUrl} alt="" className="sidebar-v9__logo-img" />
        </div>
        <nav className="sidebar-v9__nav" aria-label={t('groupNav')}>
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`sidebar-v9__item ${nav === n.id ? 'sidebar-v9__item--active' : ''}`}
              onClick={() => setNav(n.id)}
              aria-label={t(n.labelKey)}
              aria-current={nav === n.id ? 'page' : undefined}
              title={t(n.labelKey)}
            >
              <Icon name={n.icon} size={20} />
              <span className="sidebar-v9__label">{t(n.labelKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content-v9">
        {nav === 'home' && (
          <Home
            key={homeKey}
            state={state}
            liveStatus={liveStatus}
            onBoostSelected={openSelectedBoost}
            onApplyTweak={handleApplyTweak}
            onOpenBloatware={() => setBloatwareOpen(true)}
            onOpenCleaner={() => setNav('cleaner')}
            activity={activity}
            boostResult={boostResult}
            onDismissBoostResult={() => setBoostResult(null)}
            onAnalysisReady={setLastAnalysis}
          />
        )}

        {nav === 'cleaner' && (
          <SystemCleaner logActivity={logActivity} />
        )}

        {nav === 'tools' && (
          <Tools
            expertTweaks={expertTweaks}
            state={state}
            liveStatus={liveStatus}
            onToggle={handleToggle}
            onPreview={handlePreview}
            onOpenBloatware={() => setBloatwareOpen(true)}
            onOpenCleaner={() => setNav('cleaner')}
            analysis={lastAnalysis || boostResult?.afterAnalysis || null}
            running={running}
          />
        )}

        {nav === 'settings' && (
          <div className="page-panel">
            <SettingsPanel
              onBackup={handleBackup}
              onRevertAll={handleRevertAll}
              onHistoryRevert={handleHistoryRevert}
              appliedCount={appliedCount}
              totalCount={TWEAKS.length}
              revertingAll={revertingAll}
            />
          </div>
        )}
      </main>

      {boostOpen && (
        <BoostConfirmModal
          ids={boostOpen.ids}
          intensity={boostOpen.intensity}
          onClose={() => setBoostOpen(null)}
          onConfirm={() => handleBoostIds(boostOpen.ids, boostOpen.intensity)}
        />
      )}

      {modal && (
        <DryRunModal tweak={modal.tweak} action={modal.action} onClose={() => setModal(null)} onConfirm={handleConfirm} />
      )}

      {bloatwareOpen && (
        <BloatwareModal
          onClose={() => setBloatwareOpen(false)}
          onRemove={handleRemoveBloatware}
          running={running === 'bloatware'}
        />
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
      />

      <ProgressToast running={running} lines={lines} />
    </div>
  )
}

function BoostConfirmModal({ ids, intensity, onClose, onConfirm }) {
  const t = useT()
  const list = (ids || []).map((id) => {
    const tw = TWEAKS_BY_ID[id]
    const b = benefitLabel(id, tw)
    return { id, title: b.short }
  }).filter((x) => x.title)
  const isUltimate = intensity === 'experimental'
  const preview = list.slice(0, 8)
  const rest = Math.max(0, list.length - preview.length)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(480px, 92vw)' }}>
        <div className="modal__header">
          <div className="modal__title">{t('confirmSelected')}</div>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          {isUltimate && (
            <div className="warning-box">{t('ultimateWarning')}</div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
            {t('selectedPreview', { n: list.length })}
          </p>
          <ul className="boost-preview-list">
            {preview.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
            {rest > 0 && <li className="boost-preview-list__more">{t('moreItems', { n: rest })}</li>}
          </ul>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={list.length === 0}>
            {t('applySelected')} ({list.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <PrefsProvider>
      <AppInner />
    </PrefsProvider>
  )
}
