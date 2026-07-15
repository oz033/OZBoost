// =============================================================================
// Gaming Readiness Checks — 14 Gaming-kritische Settings prüfen.
// =============================================================================
// icon = monoline Icon-Key (siehe components/Icons.jsx)

export function computeReadiness(analysis) {
  if (!analysis) return []
  const s = analysis.settings || {}

  const checks = [
    {
      id: 'gameMode',
      name: 'Game Mode',
      icon: 'gamepad',
      isGood: () => s.gameModeEnabled,
      recommendation: 'Game Mode aktivieren — Windows priorisiert Spiele.',
      impact: 'Mittlerer FPS-Gewinn, stabilere Frame-Times',
      tweakId: 'tool_gamemode',
    },
    {
      id: 'hags',
      name: 'HAGS (Hardware GPU Scheduling)',
      icon: 'display',
      isGood: () => s.hagsEnabled,
      recommendation: 'HAGS aktivieren — GPU verwaltet ihren eigenen Speicher, verringert CPU-Overhead.',
      impact: 'Weniger CPU-Last, niedrigere Latenz bei VRAM-intensiven Games',
      tweakId: 'tool_hags',
    },
    {
      id: 'vbs',
      name: 'VBS / Core Isolation',
      icon: 'shield',
      isGood: () => !s.coreIsolationEnabled,
      recommendation: 'Core Isolation (VBS) deaktivieren — Virtualisierung kostet 5-10% FPS.',
      impact: '+5-10% FPS in CPU-limitierten Spielen',
      tweakId: 'core_isolation_off',
    },
    {
      id: 'memCompression',
      name: 'Memory Compression',
      icon: 'memory',
      isGood: () => !s.memoryCompressionEnabled,
      recommendation: 'Memory Compression deaktivieren — RAM-Kompression kostet CPU-Power.',
      impact: 'Weniger CPU-Overhead, mehr Power für dein Game',
      tweakId: 'memory_compression_off',
    },
    {
      id: 'mpo',
      name: 'Multiplane Overlay (MPO)',
      icon: 'settings',
      isGood: () => s.mpoDisabled,
      recommendation: 'MPO deaktivieren — fixt Flackern, FPS-Drops und Freezes im Windowed-Modus.',
      impact: 'Fixt Stuttering und Visual Glitches',
      tweakId: 'mpo_off',
    },
    {
      id: 'powerPlan',
      name: 'Ultimate Performance Plan',
      icon: 'bolt',
      isGood: () => s.isUltimatePlan,
      recommendation: 'Ultimate Performance Plan aktivieren — CPU immer auf voller Leistung.',
      impact: 'Keine Ruhetaktung, mehr FPS, stabilere Frame-Times',
      tweakId: 'power_plan',
    },
    {
      id: 'rebar',
      name: 'Resizable BAR',
      icon: 'sliders',
      isGood: () => null,
      recommendation: 'Prüfe im BIOS: Resizable BAR = Enabled. +5% FPS in unterstützten Games.',
      impact: '+3-5% FPS in RT-Titeln (Cyberpunk, RDR2, etc.)',
      tweakId: null,
    },
    {
      id: 'timerRes',
      name: 'Timer Resolution Service',
      icon: 'timer',
      isGood: () => s.timerResSvc,
      recommendation: 'Timer Resolution Service installieren — 0.5ms Timer statt 15.6ms.',
      impact: 'Spürbar weniger Input-Lag (Maus + Tastatur)',
      tweakId: 'timer_resolution',
    },
    {
      id: 'defender',
      name: 'Defender Real-Time Scan',
      icon: 'lock',
      isGood: () => s.defenderRtOff,
      recommendation: 'Defender Real-Time-Scan pausieren — kostet CPU bei jedem Dateizugriff. Nur für isolierte Gaming-PCs!',
      impact: 'Weniger CPU-Spikes beim Laden von Assets',
      tweakId: 'defender_realtime_off',
      isDanger: true,
    },
    {
      id: 'xbox',
      name: 'Xbox / Gaming Services',
      icon: 'target',
      isGood: () => (s.xboxServicesActive || 0) === 0,
      recommendation: `${s.xboxServicesActive || 0} Xbox-Services laufen im Hintergrund. Deaktivieren für mehr RAM/CPU.`,
      impact: 'Weniger Hintergrund-Services, mehr RAM frei',
      tweakId: 'gamebar_off',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: 'cloud',
      isGood: () => !s.oneDriveRunning,
      recommendation: 'OneDrive beenden — Sync-Prozesse verursachen CPU-Spikes und Disk-IO.',
      impact: 'Weniger Disk-IO und CPU-Spikes',
      tweakId: 'bloatware_remove_all',
    },
    {
      id: 'telemetry',
      name: 'Telemetrie',
      icon: 'chart',
      isGood: () => s.telemetryMin,
      recommendation: 'Telemetrie minimieren — Diagnosedaten-Sammler laufen im Hintergrund.',
      impact: 'Weniger Hintergrund-CPU + Disk-IO',
      tweakId: 'w11d_disable_telemetry',
    },
    {
      id: 'pointerPrecision',
      name: 'Mausbeschleunigung (Pointer Precision)',
      icon: 'mouse',
      isGood: () => s.pointerPrecisionOff,
      recommendation: 'Pointer Precision deaktivieren — raw aim, essenziell für Valorant/CS.',
      impact: '1:1 Mausbewegung = besseres Aiming',
      tweakId: 'pointer_precision_off',
    },
    {
      id: 'gameDvr',
      name: 'Game DVR / Hintergrundaufnahme',
      icon: 'camera',
      isGood: () => s.gameDvrDisabled,
      recommendation: 'Game DVR deaktivieren — Hintergrund-Aufnahme kostet Performance.',
      impact: 'Weniger CPU/GPU-Overhead',
      tweakId: 'w11d_gamebar_url_redirect',
    },
  ]

  return checks.map((c) => {
    const good = c.isGood()
    const status = good === null ? 'unknown' : (good ? 'good' : 'warning')
    return { ...c, status }
  })
}

export function readinessSummary(checks) {
  if (!checks.length) return null
  const good = checks.filter((c) => c.status === 'good').length
  const warning = checks.filter((c) => c.status === 'warning').length
  const unknown = checks.filter((c) => c.status === 'unknown').length
  const total = checks.length
  const pct = Math.round((good / total) * 100)
  return { good, warning, unknown, total, pct }
}
