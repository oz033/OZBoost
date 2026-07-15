// =============================================================================
// Boost-Presets — 3 Tiers (Safe/Strong/Experimental) + separate Tools-Seite.
// =============================================================================
// Ex-"Extras" wurde aufgelöst:
//   - Echte Tweaks (reg/appx/ps mit Revert) sind nach Risk in die Profile
//     einsortiert: low→safe, medium→strong, high→experimental.
//   - Launcher (nur Seiten-Öffner, Downloads, Installer, One-Shot-Aktionen)
//     leben in TOOLS und werden auf einer eigenen Tools-Seite gerendert —
//     ohne Toggle, ohne Live-Status, Öffner ohne UAC.

export const PRESETS = [
  {
    id: 'safe',
    name: 'Safe Boost',
    tagline: 'Empfohlen für alle',
    emoji: '',
    color: 'var(--risk-low-fg)',
    description:
      'Die sichersten Performance-Tweaks + Bloatware-Entfernung. ' +
      'Bringen dir 80% der FPS-Gains, ohne Risiko. Start hier.',
    riskLabel: 'Sehr sicher',
    impact: 'Stark',
    minutes: '~5 Min',
    // Echte Performance-Tweaks (kein Risiko, kein Reboot, kein Internet nötig).
    tweaks: [
      'restore_point',
      // CPU/Latenz
      'power_plan',
      'timer_resolution',
      'spectre_meltdown_off',
      'pointer_precision_off',
      'polling_cap_off',
      // GPU (sichere Treiber-Flags)
      'msi_mode',
      'mpo_off',
      // Windows-Optimierung

      'background_apps_off',
      'pause_updates',
      // OZBoost-Neuheiten (sicher, high-impact)
      'w11d_prevent_update_autoreboot',
      'w11d_disable_delivery_optimization',
      'w11d_disable_device_autoapp',
      'w11d_disable_bing_search',
      'w11d_disable_suggestions',
      'w11d_disable_telemetry',
      'w11d_disable_fast_startup',
      'w11d_disable_bitlocker_autoenc',
      'w11d_gamebar_url_redirect',
      'w11d_disable_stickykeys',
      'w11d_disable_update_asap',
      'w11d_disable_edge_ads',
      'w11d_disable_brave_bloat',
      // Ex-Extras: risk=low, sauberer Revert
      'taskbar_clean',
      'start_menu_25h2',
      'lockscreen_black',
      'theme_black',
      'context_menu_clean',
      'store_settings_optimize',
      'widgets_off',
      'file_download_warning_off',
    ],
    // Safe-Boost beinhaltet Bloatware-Auswahl als Schritt.
    includeBloatware: true,
  },
  {
    id: 'strong',
    name: 'Strong Boost',
    tagline: 'Maximaler FPS-Schub',
    emoji: '',
    color: 'var(--risk-med-fg)',
    description:
      'Alles aus Safe + schaltet Memory Compression, Core Isolation (VBS), ' +
      'GPU-Power-States und Netz-Stromsparen ab. Spürbar mehr FPS, braucht Reboot.',
    riskLabel: 'Reboot nötig',
    impact: 'Sehr stark',
    minutes: '~10 Min',
    tweaks: [
      // Safe ist implizit inkludiert (UI zeigt beide).
      'memory_compression_off',
      'core_isolation_off',
      'mmagent_off',
      // GPU Power
      'p0_state',
      'nvidia_settings',
      'amd_settings',
      'ulps_off',
      'fullscreen_exclusive',
      'hdcp_off',
      // Device/Storage Power
      'device_power_savings_off',
      'write_cache_off',
      // Network
      'network_adapter_power_off',
      'network_ipv4_only',
      // UX
      'w11d_disable_modern_standby_net',
      'w11d_disable_snap_layouts',
      'w11d_enable_end_task',
      // Ex-Extras: risk=medium
      'copilot_off',
      'gamebar_off',
      'loudness_eq_tab',
      'driver_updates_block',
      'rebar_force',
      'intel_settings',
    ],
  },
  {
    id: 'experimental',
    name: 'Experimental',
    tagline: 'Experten only',
    emoji: '',
    color: 'var(--risk-high-fg)',
    description:
      'Tiefste System-Eingriffe: Defender, Firewall, DEP, 280 Services. ' +
      'Nur für isolierte Gaming-PCs ohne Viren-Risiko.',
    riskLabel: 'Experten only',
    impact: 'Maximal',
    minutes: '~20 Min',
    tweaks: [
      'dep_off',
      'defender_realtime_off',
      'firewall_off',
      'services_off_full',
      'defender_full_off',
      'keyboard_shortcuts_off',
      // OZBoost risky
      'w11d_disable_ai_service',
      'w11d_disable_recall',
      'w11d_disable_clicktodo',
    ],
  },
]

// Lookup: welches Tier hat ein Tweak? (höchstes gewinnt)
export const TWEAK_TIER = (() => {
  const map = {}
  // Reihenfolge: Safe → Strong → Experimental (spätere überschreiben nicht
  // frühere; ein Tweak bleibt im höchsten Performance-Tier).
  const order = ['safe', 'strong', 'experimental']
  for (const id of order) {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) continue
    p.tweaks.forEach((tid) => {
      if (!map[tid]) map[tid] = id
    })
  }
  return map
})()

export function tierOf(tweakId) {
  return TWEAK_TIER[tweakId] || null
}

export function isInPreset(presetId, tweakId) {
  const p = PRESETS.find((x) => x.id === presetId)
  return p ? p.tweaks.includes(tweakId) : false
}

// Für die UI: welche Tweaks gehören zu einem Tab?
// Safe-Tab zeigt nur Safe-Tweaks.
// Strong-Tab zeigt Safe + Strong (akkumuliert).
// Experimental zeigt Safe + Strong + Experimental.
// (Der Tools-Tab rendert eine eigene Seite, keine Tweak-Liste.)
export function tweaksForTab(tabId) {
  if (tabId === 'safe') {
    return PRESETS.find((p) => p.id === 'safe').tweaks
  }
  if (tabId === 'strong') {
    return [
      ...PRESETS.find((p) => p.id === 'safe').tweaks,
      ...PRESETS.find((p) => p.id === 'strong').tweaks,
    ]
  }
  if (tabId === 'experimental') {
    return [
      ...PRESETS.find((p) => p.id === 'safe').tweaks,
      ...PRESETS.find((p) => p.id === 'strong').tweaks,
      ...PRESETS.find((p) => p.id === 'experimental').tweaks,
    ]
  }
  return []
}
