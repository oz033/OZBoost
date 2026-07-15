import { useEffect, useState, useMemo, useCallback } from 'react'
import Icon from './Icons'
import { useT } from '../lib/I18nContext'

const AREA_META = {
  windowsTemp: { icon: 'heat',    name: 'Windows Temp',          desc: 'Temporäre System- und Benutzerdateien',                      warn: false },
  shaderCache: { icon: 'gpu',     name: 'DirectX Shader Cache',   desc: 'Kompilierte Shader — werden automatisch neu erstellt',       warn: false },
  nvidiaCache: { icon: 'gpu',     name: 'NVIDIA Cache',            desc: 'DXCache + GLCache + Installer-Downloads',                    warn: false },
  amdCache:    { icon: 'gpu',     name: 'AMD Cache',               desc: 'AMD Shader- und GLCache',                                    warn: false },
  updateCache: { icon: 'refresh', name: 'Windows Update Cache',    desc: 'Bereits heruntergeladene Update-Pakete',                     warn: false },
  deliveryOpt: { icon: 'package', name: 'Delivery Optimization',   desc: 'P2P-Update-Zwischenspeicher',                                 warn: false },
  browserCache:{ icon: 'network', name: 'Browser Cache',           desc: 'Chrome · Edge · Firefox · Brave',                            warn: true,  warnText: 'Webseiten müssen sich neu laden' },
  crashDumps:  { icon: 'crash',   name: 'Crash Dumps',             desc: 'Speicherabbilder bei Programmabstürzen',                     warn: false },
  miniDumps:   { icon: 'list',    name: 'Mini Dumps',              desc: 'Bluescreen-Speicherabbilder (MEMORY.DMP)',                   warn: false },
  recycleBin:  { icon: 'trash',   name: 'Papierkorb',              desc: 'Gelöschte Dateien — endgültig entfernt',                     warn: false },
}

function formatSize(mb) {
  if (!mb || mb === 0) return '0 MB'
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return Math.round(mb) + ' MB'
}

export default function SystemCleaner({ logActivity }) {
  const t = useT()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [result, setResult] = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setResult(null)
    window.api.scanCleaner().then((res) => {
      if (res && !res.error && res.areas) {
        setScan(res)
        setSelected(new Set(res.areas.filter((a) => a.fileCount > 0).map((a) => a.id)))
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const areas = useMemo(() => {
    if (!scan?.areas) return []
    return scan.areas.map((a) => ({
      ...a,
      ...AREA_META[a.id],
    }))
  }, [scan])

  const selectedAreas = areas.filter((a) => selected.has(a.id))
  const selectedSize = selectedAreas.reduce((s, a) => s + (a.sizeMB || 0), 0)
  const selectedFiles = selectedAreas.reduce((s, a) => s + (a.fileCount || 0), 0)
  const totalSize = areas.reduce((s, a) => s + (a.sizeMB || 0), 0)
  const totalFiles = areas.reduce((s, a) => s + (a.fileCount || 0), 0)

  function toggle(id) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(areas.map((a) => a.id))) }
  function selectNone() { setSelected(new Set()) }
  function selectRecommended() {
    setSelected(new Set(areas.filter((a) => !AREA_META[a.id]?.warn).map((a) => a.id)))
  }

  async function handleClean() {
    setCleaning(true)
    setResult(null)
    const ids = [...selected]
    const res = await window.api.cleanAreas(ids)
    setCleaning(false)
    if (res && !res.error) {
      setResult(res)
      logActivity?.(`System Cleaner: ${formatSize(res.totalFreedMB)} freigegeben`, 'clean')
      setTimeout(refresh, 600)
    }
  }

  if (loading) {
    return (
      <div className="sc-container">
        <div className="sc-loading">
          <div className="score-spinner" />
          <p>{t('cleanerScan')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sc-container">
      <div className="sc-hero">
        <div className="sc-hero__icon"><Icon name="clean" size={24} /></div>
        <div className="sc-hero__body">
          <div className="sc-hero__title">{t('cleanerTitle')}</div>
          <div className="sc-hero__sub">
            {t('cleanerSub', { files: totalFiles.toLocaleString(), size: formatSize(totalSize) })}
          </div>
        </div>
        <button className="sc-refresh-btn" onClick={refresh} disabled={cleaning || loading} aria-label={t('cleanerRefresh')}>
          <Icon name="refresh" size={18} />
        </button>
      </div>

      {result && (
        <div className="sc-result">
          <span className="sc-result__icon"><Icon name="sparkles" size={20} /></span>
          <span className="sc-result__text">
            <strong>{t('cleanerFreed', { size: formatSize(result.totalFreedMB) })}</strong>
            {' '}({t('cleanerAreas', { n: result.areas?.filter((a) => a.cleaned > 0).length || 0 })})
          </span>
        </div>
      )}

      <div className="sc-actionbar">
        <div className="sc-actionbar__left">
          <button className="sc-chip-btn" onClick={selectAll}>{t('cleanerAll')}</button>
          <button className="sc-chip-btn sc-chip-btn--accent" onClick={selectRecommended}>{t('cleanerRecommended')}</button>
          <button className="sc-chip-btn" onClick={selectNone}>{t('cleanerNone')}</button>
        </div>
        <div className="sc-actionbar__right">
          <span className="sc-actionbar__count">
            {t('cleanerFiles', { n: selectedFiles.toLocaleString() })}
          </span>
          <span className="sc-actionbar__size">{formatSize(selectedSize)}</span>
          <button
            className="sc-clean-btn"
            disabled={selected.size === 0 || cleaning}
            onClick={handleClean}
          >
            {cleaning ? (
              <><span className="sc-clean-btn__spinner" /> {t('cleanerRunning')}</>
            ) : (
              <>{t('cleanerRun', { n: selected.size })}</>
            )}
          </button>
        </div>
      </div>

      <div className="sc-areas">
        {areas.map((area) => {
          const meta = AREA_META[area.id] || {}
          const isSel = selected.has(area.id)
          const isEmpty = !area.fileCount || area.fileCount === 0
          return (
            <div
              key={area.id}
              className={`sc-area ${isSel ? 'sc-area--selected' : ''} ${isEmpty ? 'sc-area--empty' : ''}`}
              onClick={() => !cleaning && toggle(area.id)}
            >
              <div className="sc-area__check">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(area.id)}
                  disabled={cleaning}
                />
              </div>
              <div className="sc-area__icon">
                <Icon name={meta.icon || 'folder'} size={18} />
              </div>
              <div className="sc-area__body">
                <div className="sc-area__name">{meta.name || area.id}</div>
                <div className="sc-area__desc">{meta.desc || ''}</div>
                {meta.warn && <div className="sc-area__warn">{meta.warnText}</div>}
              </div>
              <div className="sc-area__stats">
                {isEmpty ? (
                  <span className="sc-area__clean">{t('cleanerClean')}</span>
                ) : (
                  <>
                    <span className="sc-area__files">{area.fileCount.toLocaleString()} Dateien</span>
                    <span className="sc-area__size">{formatSize(area.sizeMB)}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
