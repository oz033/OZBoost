// =============================================================================
// Tools — open/download helpers for diagnosis, monitoring, GPU-tuning tools
// =============================================================================
// These are PURE_OPEN (no system changes) or DOWNLOAD_INSTALL (fetch + run).

// winget-first installer snippet: installs the LATEST version via winget
// (official source, always current). Falls back to the pinned OZBoost portable
// exe only when winget is unavailable/fails, so the button never dead-ends.
// 0x8A15002B (-1978335189) = "already installed" → counts as success.
function wingetFirstPs(wingetId, fallbackFile, label) {
  return (
    `$ok = $false; ` +
    `try { ` +
    `winget install --id ${wingetId} -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null; ` +
    `if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq -1978335189) { $ok = $true } ` +
    `} catch {}; ` +
    `if ($ok) { "${label}: neueste Version via winget installiert - siehe Startmenü" } ` +
    `else { ` +
    `"winget nicht verfügbar - Fallback auf geprüfte Portable-Version"; ` +
    `$f = "$env:SystemRoot\\Temp\\${fallbackFile}"; ` +
    `IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/${fallbackFile}" -OutFile $f; ` +
    `Start-Process $f ` +
    `}`
  )
}

export const TOOLS_TWEAKS = [
  {
    id: 'tool_gamemode',
    category: 'tools',
    step: 1,
    title: 'Game Mode-Einstellungen',
    summary: 'Öffnet die Windows Game Mode-Seite.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'ms-settings:gaming-gamemode' }], revert: [] },
  },
  {
    id: 'tool_core_isolation',
    category: 'tools',
    step: 2,
    title: 'Core Isolation öffnen',
    summary: 'Öffnet die Core Isolation / Memory Integrity Seite.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'windowsdefender://coreisolation/' }], revert: [] },
  },
  {
    id: 'tool_pointer_precision',
    category: 'tools',
    step: 3,
    title: 'Maus-Eigenschaften',
    summary: 'Öffnet die klassische Maus-Systemsteuerung (Pointer Precision etc.).',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'control.exe main.cpl ,2' }], revert: [] },
  },
  {
    id: 'tool_resolution',
    category: 'tools',
    step: 4,
    title: 'Auflösung & Bildrate',
    summary: 'Öffnet die Display-Einstellungen.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'ms-settings:display' }], revert: [] },
  },
  {
    id: 'tool_hags',
    category: 'tools',
    step: 5,
    title: 'HAGS (Hardware GPU Scheduling)',
    summary: 'Öffnet die erweiterten Grafik-Einstellungen.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'ms-settings:display-advancedgraphics' }], revert: [] },
  },
  {
    id: 'tool_sound',
    category: 'tools',
    step: 6,
    title: 'Sound-Systemsteuerung',
    summary: 'Öffnet die klassische mmsys.cpl.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'mmsys.cpl' }], revert: [] },
  },
  {
    id: 'tool_scaling',
    category: 'tools',
    step: 7,
    title: 'Erweiterte Display-Skalierung',
    summary: 'Öffnet die erweiterte Skalierungs-Seite.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'ms-settings:display-advanced' }], revert: [] },
  },
  {
    id: 'tool_power_plan_cpl',
    category: 'tools',
    step: 8,
    title: 'Energieoptionen (Systemsteuerung)',
    summary: 'Öffnet powercfg.cpl.',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: { apply: [{ type: 'open', target: 'powercfg.cpl' }], revert: [] },
  },
  {
    id: 'tool_hwinfo',
    category: 'tools',
    step: 9,
    title: 'HWiNFO installieren',
    summary: 'Installiert die NEUESTE Version via winget (Monitoring: Temps, Takt, Sensoren). Fallback: geprüfte Portable-Version.',
    risk: 'low',
    requiresInternet: true,
    requiresAdmin: false,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: wingetFirstPs('REALiX.HWiNFO', 'hwinfo.exe', 'HWiNFO') }],
      revert: [],
    },
  },
  {
    id: 'tool_cpuz',
    category: 'tools',
    step: 10,
    title: 'CPU-Z installieren',
    summary: 'Installiert die NEUESTE Version via winget (RAM/CPU-Verifikation). Fallback: geprüfte Portable-Version.',
    risk: 'low',
    requiresInternet: true,
    requiresAdmin: false,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: wingetFirstPs('CPUID.CPU-Z', 'cpuz.exe', 'CPU-Z') }],
      revert: [],
    },
  },
  {
    id: 'tool_gpuz',
    category: 'tools',
    step: 11,
    title: 'GPU-Z installieren',
    summary: 'Installiert die NEUESTE Version via winget (GPU/PCIe-Verifikation). Fallback: geprüfte Portable-Version.',
    risk: 'low',
    requiresInternet: true,
    requiresAdmin: false,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: wingetFirstPs('TechPowerUp.GPU-Z', 'gpuz.exe', 'GPU-Z') }],
      revert: [],
    },
  },
  {
    id: 'tool_msi_afterburner',
    category: 'tools',
    step: 12,
    title: 'MSI Afterburner installieren',
    summary: 'Lädt MSI Afterburner + RTSS und installiert sie debloated: kein Autostart, Power-Logging aus (kostet sonst FPS), sauberes OSD.',
    risk: 'medium',
    requiresInternet: true,
    requiresAdmin: true,
    debloated: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', module: 'MSI-Afterburner', args: {} }],
      revert: [],
    },
  },
  {
    id: 'tool_cru_sre',
    category: 'tools',
    step: 13,
    title: 'CRU + SRE installieren',
    summary: 'Custom Resolution Utility + Scaled Resolution Editor — du wählst, welche installiert werden.',
    risk: 'medium',
    requiresInternet: true,
    requiresAdmin: true,
    source: 'OZBoost',
    choices: {
      argKey: 'items',
      note: 'Portable Tools — landen in Program Files (x86)\\CRUSRE mit Desktop-Verknüpfung.',
      items: [
        { id: 'cru', name: 'CRU — Custom Resolution Utility', desc: 'Eigene Auflösungen & Hz anlegen (z.B. 1440p @ 165 Hz erzwingen).', default: true },
        { id: 'sre', name: 'SRE — Scaled Resolution Editor', desc: 'Skalierte Auflösungen für GPU-Scaling bearbeiten (Stretched Res etc.).', default: true },
      ],
    },
    actions: {
      apply: [{ type: 'ps_module', module: 'CRU-SRE', args: {} }],
      revert: [],
    },
  },
  {
    id: 'tool_bios',
    category: 'tools',
    step: 14,
    title: 'Ins BIOS rebooten',
    summary: 'Rebootet direkt ins BIOS/UEFI.',
    risk: 'medium',
    requiresAdmin: true,
    requiresReboot: true,
    source: 'OZBoost',
    actions: { apply: [{ type: 'cmd', command: 'shutdown /r /fw /t 0' }], revert: [] },
  },
  {
    id: 'tool_gaming_installers',
    category: 'tools',
    step: 15,
    title: 'Gaming-Launcher installieren',
    summary: 'Du wählst deine Launcher — es öffnet nur die offiziellen Download-Seiten. Keine Bundles, keine Toolbars, kein Bloat.',
    risk: 'medium',
    requiresInternet: true,
    requiresAdmin: true,
    debloated: true,
    source: 'OZBoost',
    choices: {
      argKey: 'launchers',
      note: 'Haken setzen = offizielle Download-Seite öffnet sich im Browser. Nichts wird ungefragt installiert.',
      items: [
        { id: 'Steam', name: 'Steam', desc: 'Die größte PC-Spiele-Plattform. Brauchst du fast sicher.', default: true },
        { id: 'Discord', name: 'Discord', desc: 'Chat & Voice zum Zocken mit Freunden.', default: true },
        { id: 'Epic Games', name: 'Epic Games', desc: 'Fortnite + jede Woche Gratis-Spiele.', default: false },
        { id: 'Battle.net', name: 'Battle.net', desc: 'Blizzard-Spiele: WoW, Overwatch, Diablo, CoD.', default: false },
        { id: 'Riot (Valorant)', name: 'Riot (Valorant)', desc: 'Valorant-Download.', default: false },
        { id: 'League of Legends', name: 'League of Legends', desc: 'LoL-Download & Registrierung.', default: false },
        { id: 'EA App', name: 'EA App', desc: 'EA-Spiele: FC/FIFA, Battlefield, Die Sims.', default: false },
        { id: 'Ubisoft Connect', name: 'Ubisoft Connect', desc: "Ubisoft-Spiele: Assassin's Creed, Rainbow Six.", default: false },
        { id: 'GOG Galaxy', name: 'GOG Galaxy', desc: 'DRM-freie Spiele (ohne Kopierschutz).', default: false },
        { id: 'Roblox', name: 'Roblox', desc: 'Roblox-Client.', default: false },
      ],
    },
    actions: {
      apply: [{ type: 'ps_module', module: 'Gaming-Installers', args: {} }],
      revert: [],
    },
  },
]
