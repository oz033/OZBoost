// =============================================================================
// Performance Score Engine
// =============================================================================
// Nimmt die System-Analyse und berechnet:
//   - performanceScore (0-100)
//   - boostPotential: { safe, strong, ultimate }
//   - systemStatus: { cpu, gpu, ram, ... } — good | warning | bad
//   - recommendations: array von Klartext-Empfehlungen (icon = Icon-Key)

export function computeScore(analysis) {
  if (!analysis) return null

  const s = analysis.settings || {}
  let score = 100
  const deductions = []
  const recommendations = []
  let fpsPotential = 0
  let latencyReductionMs = 0
  let backgroundLoadReduction = 0
  let responsivenessGain = 0

  if (!s.isUltimatePlan) {
    score -= 8
    deductions.push('Energieplan nicht auf Ultimate Performance')
    recommendations.push({ id: 'power_plan', icon: 'bolt', text: 'Ultimate Performance Plan', desc: 'CPU vollpower, keine Ruhetaktung', points: 8, mode: 'safe' })
    fpsPotential += 3; responsivenessGain += 4
  }
  if (s.coreIsolationEnabled) {
    score -= 7
    deductions.push('Core Isolation / VBS aktiv (-5-10% FPS)')
    recommendations.push({ id: 'core_isolation_off', icon: 'shield', text: 'Core Isolation (VBS) deaktivieren', desc: 'Virtualisierung die FPS massiv bremst', points: 7, mode: 'strong' })
    fpsPotential += 5; responsivenessGain += 3
  }
  if (s.memoryCompressionEnabled) {
    score -= 5
    deductions.push('Memory Compression aktiv')
    recommendations.push({ id: 'memory_compression_off', icon: 'memory', text: 'Memory Compression deaktivieren', desc: 'RAM-Kompression kostet CPU-Power', points: 5, mode: 'strong' })
    fpsPotential += 2; responsivenessGain += 2
  }
  if (!s.gameModeEnabled) {
    score -= 3
    recommendations.push({ id: 'tool_gamemode', icon: 'gamepad', text: 'Game Mode aktivieren', desc: 'Windows priorisiert Games', points: 3, mode: 'safe' })
    fpsPotential += 1
  }
  if (!s.hagsEnabled) {
    score -= 4
    deductions.push('HAGS nicht aktiv')
    recommendations.push({ id: 'tool_hags', icon: 'display', text: 'HAGS aktivieren', desc: 'Hardware GPU Scheduling für niedrigere Latenz', points: 4, mode: 'safe' })
    latencyReductionMs += 2; fpsPotential += 1
  }
  if (!s.mpoDisabled) {
    score -= 5
    deductions.push('Multiplane Overlay (MPO) aktiv — kann Flackern verursachen')
    recommendations.push({ id: 'mpo_off', icon: 'settings', text: 'MPO deaktivieren', desc: 'Fixt Flackern und FPS-Drops im Windowed-Modus', points: 5, mode: 'safe' })
    fpsPotential += 2; latencyReductionMs += 1
  }
  if (!s.gameDvrDisabled) {
    score -= 3
    deductions.push('Game DVR aktiv — kostet Performance')
    recommendations.push({ id: 'w11d_gamebar_url_redirect', icon: 'camera', text: 'Game DVR/GameBar reduzieren', desc: 'Hintergrund-Aufnahme deaktivieren', points: 3, mode: 'safe' })
    fpsPotential += 1; backgroundLoadReduction += 2
  }
  if (!s.pointerPrecisionOff) {
    score -= 5
    deductions.push('Mausbeschleunigung (Pointer Precision) aktiv — schlecht für Aim')
    recommendations.push({ id: 'pointer_precision_off', icon: 'mouse', text: 'Mausbeschleunigung deaktivieren', desc: 'Raw Aim — essenziell für FPS', points: 5, mode: 'safe' })
    latencyReductionMs += 1
  }
  if (!s.spectreMeltdownOff) {
    score -= 6
    deductions.push('Spectre/Meltdown Mitigations aktiv (-5-10% FPS)')
    recommendations.push({ id: 'spectre_meltdown_off', icon: 'shield', text: 'Spectre/Meltdown deaktivieren', desc: 'CPU-Security-Patches kosten Performance', points: 6, mode: 'strong' })
    fpsPotential += 4; responsivenessGain += 3
  }
  if (!s.defenderRtOff) {
    score -= 2
    deductions.push('Defender Real-Time aktiv (kostet etwas CPU)')
    recommendations.push({ id: 'defender_realtime_off', icon: 'shield', text: 'Defender pausieren', desc: 'Real-Time-Scan stoppen (nur für Gaming-PCs)', points: 2, mode: 'ultimate' })
    backgroundLoadReduction += 3; fpsPotential += 1
  }
  if (!s.telemetryMin) {
    score -= 3
    deductions.push('Telemetrie nicht minimiert')
    recommendations.push({ id: 'w11d_disable_telemetry', icon: 'chart', text: 'Telemetrie minimieren', desc: 'Datensammler abschalten', points: 3, mode: 'safe' })
    backgroundLoadReduction += 2
  }
  if (s.xboxServicesActive > 0) {
    score -= 2
    deductions.push(`${s.xboxServicesActive} Xbox/Gaming-Services aktiv`)
    recommendations.push({ id: 'gamebar_off', icon: 'gamepad', text: `Xbox-Services reduzieren`, desc: `${s.xboxServicesActive} Hintergrund-Services`, points: 2, mode: 'strong' })
    backgroundLoadReduction += 2
  }
  if (s.oneDriveRunning) {
    score -= 3
    deductions.push('OneDrive läuft im Hintergrund')
    recommendations.push({ id: 'bloatware_remove_all', icon: 'cloud', text: 'OneDrive stoppen', desc: 'Sync im Hintergrund beenden', points: 3, mode: 'strong' })
    backgroundLoadReduction += 2
  }
  if (!s.recallDisabled) {
    score -= 2
    deductions.push('Windows Recall nicht blockiert')
    recommendations.push({ id: 'w11d_disable_recall', icon: 'camera', text: 'Recall blockieren', desc: 'AI-Screenshot-Aufzeichnung stoppen', points: 2, mode: 'safe' })
    backgroundLoadReduction += 1
  }
  if (!s.widgetsDisabled) {
    score -= 2
    deductions.push('Widgets nicht deaktiviert')
    recommendations.push({ id: 'widgets_off', icon: 'news', text: 'Widgets deaktivieren', desc: 'Taskleiste + Hintergrundprozesse', points: 2, mode: 'safe' })
    backgroundLoadReduction += 1
  }
  if (!s.copilotDisabled) {
    score -= 1
    deductions.push('Copilot nicht deaktiviert')
    recommendations.push({ id: 'copilot_off', icon: 'robot', text: 'Copilot deaktivieren', desc: 'AI-Assistent entfernen', points: 1, mode: 'safe' })
  }
  if (!s.backgroundAppsDisabled) {
    score -= 3
    deductions.push('Background Apps nicht blockiert')
    recommendations.push({ id: 'background_apps_off', icon: 'phone', text: 'Hintergrund-Apps blockieren', desc: 'UWP-Apps nicht mehr im Hintergrund', points: 3, mode: 'safe' })
    backgroundLoadReduction += 2
  }
  if (!s.timerResSvc) {
    score -= 4
    deductions.push('Timer Resolution Service nicht installiert')
    recommendations.push({ id: 'timer_resolution', icon: 'timer', text: 'Timer Resolution installieren', desc: '0.5ms Timer = spürbar weniger Input-Lag', points: 4, mode: 'safe' })
    latencyReductionMs += 3
  }

  if (analysis.background?.processCount > 180) {
    score -= 3
    deductions.push(`${analysis.background.processCount} Prozesse — viel Hintergrund-Last`)
    backgroundLoadReduction += 3
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  const boostPotential = { safe: 0, strong: 0, ultimate: 0 }
  for (const r of recommendations) {
    boostPotential[r.mode] = (boostPotential[r.mode] || 0) + r.points
  }
  boostPotential.strong += boostPotential.safe
  boostPotential.ultimate += boostPotential.strong

  const systemStatus = {
    cpu: scoreDeductionsInclude(deductions, 'Spectre|Timer|Core Isolation|Memory Compression') ? 'warning' : 'good',
    gpu: !s.hagsEnabled || !s.mpoDisabled ? 'warning' : 'good',
    ram: analysis.ram?.usedPercent > 75 ? 'warning' : 'good',
    storage: analysis.storage?.hasSSD ? 'good' : 'warning',
    network: 'good',
    windows: score < 70 ? 'warning' : 'good',
    defender: !s.defenderRtOff ? 'warning' : 'good',
    drivers: 'good',
    background: analysis.background?.processCount > 180 ? 'warning' : 'good',
  }
  if (score < 50) {
    systemStatus.cpu = 'bad'
    systemStatus.windows = 'bad'
  }

  const insights = {
    items: [
      { label: 'Background CPU %', value: analysis.background?.processCount > 180 ? 'Hoch' : 'Normal', status: analysis.background?.processCount > 180 ? 'warning' : 'good' },
      { label: 'RAM Usage', value: `${analysis.ram?.usedPercent || 0}%`, status: analysis.ram?.usedPercent > 75 ? 'warning' : 'good' },
      { label: 'Running Processes', value: analysis.background?.processCount || 0, status: analysis.background?.processCount > 180 ? 'warning' : 'good' },
      { label: 'Running Services', value: analysis.services?.running || 0, status: analysis.services?.running > 100 ? 'warning' : 'good' },
      { label: 'Startup Apps', value: analysis.startup?.count || 0, status: analysis.startup?.count > 15 ? 'warning' : 'good' },
      { label: 'Power Plan', value: s.isUltimatePlan ? 'Ultimate' : 'Default', status: s.isUltimatePlan ? 'good' : 'warning' },
      { label: 'Game Mode', value: s.gameModeEnabled ? 'An' : 'Aus', status: s.gameModeEnabled ? 'good' : 'warning' },
      { label: 'VBS / Core Isolation', value: s.coreIsolationEnabled ? 'An (-FPS)' : 'Aus', status: s.coreIsolationEnabled ? 'bad' : 'good' },
      { label: 'HAGS', value: s.hagsEnabled ? 'An' : 'Aus', status: s.hagsEnabled ? 'good' : 'warning' },
      { label: 'MPO', value: s.mpoDisabled ? 'Aus (gut)' : 'An', status: s.mpoDisabled ? 'good' : 'warning' },
      { label: 'Memory Compression', value: s.memoryCompressionEnabled ? 'An (-CPU)' : 'Aus', status: s.memoryCompressionEnabled ? 'warning' : 'good' },
    ]
  }

  return {
    score,
    level: performanceLevel(score),
    boostPotential,
    potential: {
      fps: fpsPotential,
      latencyMs: latencyReductionMs,
      backgroundLoadPct: backgroundLoadReduction,
      responsivenessPct: responsivenessGain,
    },
    deductions,
    recommendations: recommendations.sort((a, b) => b.points - a.points),
    systemStatus,
    insights,
  }
}

function scoreDeductionsInclude(deductions, pattern) {
  const re = new RegExp(pattern, 'i')
  return deductions.some((d) => re.test(d))
}

export function performanceLevel(score) {
  if (score >= 95) return { name: 'Legend',  color: '#bf5af2' }
  if (score >= 85) return { name: 'Diamond', color: '#64d2ff' }
  if (score >= 70) return { name: 'Gold',    color: '#ffd60a' }
  if (score >= 55) return { name: 'Silver',  color: '#98989d' }
  return { name: 'Bronze', color: '#ac8e68' }
}

export const STATUS_ICON = { good: 'good', warning: 'warning', bad: 'bad' }
export const STATUS_LABEL = { good: 'Optimal', warning: 'Optimierbar', bad: 'Kritisch' }

export function scoreColor(score) {
  if (score >= 80) return '#3dd68c'
  if (score >= 60) return '#ffb020'
  return '#ff2d37'
}

export function scoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Gut'
  if (score >= 60) return 'Mittel'
  if (score >= 40) return 'Optimierbar'
  return 'Kritisch'
}

export const MODE_META = {
  safe:     { label: 'Safe',     color: '#3dd68c', risk: 'Kein Risiko' },
  strong:   { label: 'Strong',   color: '#ffb020', risk: 'Reboot nötig' },
  ultimate: { label: 'Ultimate', color: '#ff2d37', risk: 'Experten' },
}
