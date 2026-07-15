// =============================================================================
// Klartext-Erklärungen + Impact-Ratings für jeden Tweak.
// =============================================================================
// Das ist die "Übersetzung" von Technik-Jargon in Gamersprache.
// Impact (1-5 Sterne): wie viel spürbarer FPS/Latenz-Gewinn bringt der Tweak?

// Impact-Skala:
//   ★      = minimal, kaum spürbar (cosmetic/privacy)
//   ★★     = klein, leicht spürbar bei非常高 CPU-Last
//   ★★★    = solider Boost, spürbar in benchmarks
//   ★★★★   = starker Boost, in den meisten Games sichtbar
//   ★★★★★  = game-changing, dramatischer Unterschied

export const BENEFITS = {
  // ─── CPU/Latenz (höchster Impact) ───
  power_plan: {
    impact: 5,
    short: 'Mehr CPU-Power',
    benefit: 'Zwingt deine CPU, immer auf voller Leistung zu laufen — keine Ruhetakteistung, keine abgeschalteten Cores. Direkt mehr FPS und stabilere Frame-Times.',
  },
  timer_resolution: {
    impact: 5,
    short: 'Weniger Input-Lag',
    benefit: 'Senkt die System-Timer-Auflösung von 15ms auf 0.5ms. Deine Maus-Klicks und Tasten-Eingaben werden schneller verarbeitet — ein spürbarer Vorteil in Valorant/CS.',
  },
  spectre_meltdown_off: {
    impact: 4,
    short: '+5-10% FPS',
    benefit: 'Schaltet die CPU-Sicherheits-Patches ab, die 2018 eingebaut wurden. Kostet Performance — ohne sie ist deine CPU deutlich schneller.',
  },
  dep_off: {
    impact: 3,
    short: 'Kleine FPS',
    benefit: 'Schaltet die Data Execution Prevention ab. Kleiner FPS-Gewinn, aber braucht Secure Boot OFF und einen Neustart.',
  },
  memory_compression_off: {
    impact: 4,
    short: 'Weniger CPU-Last',
    benefit: 'Windows komprimiert normalerweise deinen RAM im Hintergrund — das kostet CPU. Ohne das hast du mehr CPU-Power für dein Game.',
  },
  core_isolation_off: {
    impact: 4,
    short: '+5-10% FPS',
    benefit: 'Schaltet Microsofts Memory Integrity (VBS) ab — eine Virtualisierung, die deine FPS massiv bremsen kann. Einer der größten Gewinne.',
  },

  // ─── GPU ───
  msi_mode: {
    impact: 3,
    short: 'Weniger Stutter',
    benefit: 'Optimiert, wie deine Grafikkarte mit der CPU kommuniziert. Reduziert Mikro-Ruckler und verbessert die 1% Low-FPS.',
  },
  p0_state: {
    impact: 4,
    short: 'GPU boostet sofort',
    benefit: 'Erzwingt, dass deine NVIDIA-Karte sofort auf maximale Taktfrequenz geht, statt hochzutakeln. Kein verzögerter Boost mehr.',
  },
  nvidia_settings: {
    impact: 3,
    short: 'Treiber-Optimierung',
    benefit: 'Stellt deinen NVIDIA-Treiber auf Performance: PhysX auf GPU, Tray aus, Legacy-Sharpen an.',
  },
  amd_settings: {
    impact: 3,
    short: 'Adrenalin-Optimierung',
    benefit: 'VSync aus, Texture-Filter Performance, Tessellation off, Vari-Bright max, Overlay/Tray/Werbung aus.',
  },
  ulps_off: {
    impact: 3,
    short: 'Keine GPU-Sleeps',
    benefit: 'Verhindert, dass deine AMD-Karte in Stromspar-Modi fällt. Stabilere Frametimes, keine Aufwach-Latenz.',
  },
  mpo_off: {
    impact: 4,
    short: 'Fixt Flackern',
    benefit: 'Multiplane Overlay ist eine häufige Ursache für Flackern, FPS-Drops und Freezes im Windowed-Modus. Aus = Problem gelöst.',
  },
  independent_flip: {
    impact: 3,
    short: 'Display-Latenz',
    benefit: 'Aktiviert den direkten Display-Flip-Pfad, der die Latenz zwischen Frame und Bildschirm-Anzeige verringert.',
  },
  fullscreen_exclusive: {
    impact: 3,
    short: 'Volles GPU-Focus',
    benefit: 'Gibt deinem Game exklusiven Zugriff auf die GPU statt es im Fenstermodus laufen zu lassen. Etwas Input-Lag-Gewinn.',
  },

  // ─── Input ───
  pointer_precision_off: {
    impact: 5,
    short: 'Raw Aim',
    benefit: 'Schaltet die Windows-Mausbeschleunigung ab. Deine Maus-Bewegung ist 1:1 wie du sie machst — essenziell für Valorant/CS.',
  },
  polling_cap_off: {
    impact: 3,
    short: 'Maus im Fokus',
    benefit: 'Verhindert, dass Windows deine Maus-Polling-Rate im Hintergrund drosselt (120→125Hz). Beim Alt-Tab relevant.',
  },

  // ─── Display ───

  // ─── Windows/Debloat ───
  background_apps_off: {
    impact: 3,
    short: 'RAM/CPU frei',
    benefit: 'Apps laufen nicht mehr im Hintergrund und klauen dir RAM und CPU-Power, die dein Game braucht.',
  },
  mmagent_off: {
    impact: 2,
    short: 'Weniger Hintergrund',
    benefit: 'Schaltet Prefetcher und App-PreLaunch ab — Windows rät nicht mehr, was du gleich starten könntest.',
  },
  w11d_prevent_update_autoreboot: {
    impact: 5,
    short: 'Kein Reboot mitten im Game',
    benefit: 'Windows startet sich nicht mehr selbst neu, während du spielst. Retter deiner Ranked-Games.',
  },
  w11d_disable_delivery_optimization: {
    impact: 2,
    short: 'Kein P2P-Upload',
    benefit: 'Windows lädt Updates nicht mehr heimlich von anderen PCs hoch/runter — keine CPU/Bandbreite im Hintergrund.',
  },
  w11d_disable_device_autoapp: {
    impact: 2,
    short: 'Keine OEM-Bloat',
    benefit: 'Verhindert, dass Windows beim Anschließen von Monitoren/Headsets heimlich Hersteller-Tools installiert.',
  },
  w11d_disable_telemetry: {
    impact: 2,
    short: 'Weniger Background-CPU',
    benefit: 'Schaltet die Datensammler ab, die deine Nutzung tracken. Sparpatch CPU und Speicher.',
  },
  w11d_disable_bing_search: {
    impact: 1,
    short: 'Saubere Suche',
    benefit: 'Keine Bing-Web-Suchvorschläge mehr im Startmenü. Schneller und privacy-freundlicher.',
  },
  w11d_disable_suggestions: {
    impact: 1,
    short: 'Keine Werbung',
    benefit: 'Schaltet die "Du könntest auch..." Vorschläge und "Tipps"-Notifications ab.',
  },
  w11d_disable_fast_startup: {
    impact: 3,
    short: 'Sauberer Boot',
    benefit: 'Windows fährt wirklich runter statt in einen Hybrid-Sleep. Vermeidet Instabilität nach dem Boot.',
  },
  w11d_disable_bitlocker_autoenc: {
    impact: 2,
    short: 'Keine Verschlüsselung',
    benefit: 'Verhindert, dass Windows deine Platte automatisch verschlüsselt — das kostet Performance bei jedem Schreibzugriff.',
  },
  w11d_gamebar_url_redirect: {
    impact: 2,
    short: 'Keine GameBar-Popups',
    benefit: 'Stoppt diese nervigen "Drücke Win+G für Game Bar" Popups, die beim Game-Start aufpoppen.',
  },
  w11d_disable_stickykeys: {
    impact: 1,
    short: 'Kein Sticky-Popup',
    benefit: 'Beendet den "Möchtest du StickyKeys aktivieren?" Dialog beim 5-fachen Shift-Drücken (typisch beim Crouchen).',
  },
  w11d_disable_snap_layouts: {
    impact: 1,
    short: 'Keine Snap-Vorschläge',
    benefit: 'Schaltet die Snap-Layout-Popups beim Hovern über Maximieren ab.',
  },
  w11d_enable_end_task: {
    impact: 1,
    short: 'Task beenden per Rechtsklick',
    benefit: 'Fügt der Taskleiste einen direkten "End Task" Eintrag hinzu — schneller killen abgestürzter Apps.',
  },
  w11d_disable_modern_standby_net: {
    impact: 2,
    short: 'Laptop-Akku',
    benefit: 'Nur Laptops: verhindert, dass Windows im Standby weiter Netzwerk macht — Akku hält länger.',
  },

  // ─── Riskante Tweaks ───
  defender_realtime_off: {
    impact: 2,
    short: 'Kein Virenscan',
    benefit: 'Schaltet den Echtzeit-Virenscanner ab. Spare CPU, aber du bist dann ohne Schutz — nur für clevere User.',
  },
  firewall_off: {
    impact: 1,
    short: 'Firewall aus',
    benefit: 'Deaktiviert die Windows Firewall. Winzig FPS, aber du verlierst deinen Netz-Schutz.',
  },
  services_off_full: {
    impact: 3,
    short: '280 Services aus',
    benefit: 'Deaktiviert 280+ nicht-essentielle Windows-Services (Xbox, Telemetrie, Print, Maps...). Viel RAM frei.',
  },
  keyboard_shortcuts_off: {
    impact: 2,
    short: 'Kein Tabbing-out',
    benefit: 'Schaltet Win/Alt/Esc-Shortcuts ab, damit du nicht versehentlich aus dem Game fliegst.',
  },

  // ─── Network ───
  network_adapter_power_off: {
    impact: 2,
    short: 'Stabile Pings',
    benefit: 'Deaktiviert Stromspar-Features deines Netzwerkadapters, die zu Pingschwankungen führen können.',
  },
  network_ipv4_only: {
    impact: 1,
    short: 'IPv6 aus',
    benefit: 'Deaktiviert nicht-genutzte Netzwerk-Bindungen (IPv6, QoS, File-Sharing). Minimaler Overhead-Gewinn.',
  },

  // ─── Storage ───
  write_cache_off: {
    impact: 2,
    short: 'Schnellere Schreibzugriffe',
    benefit: 'Optimiert den Write-Cache deiner SSDs/HDDs — schnellere Ladezeiten und Asset-Streaming.',
  },
  device_power_savings_off: {
    impact: 2,
    short: 'USB/PCI stabil',
    benefit: 'Schaltet Stromspar-Features auf USB/PCI/HID-Geräten ab — kein Device-Sleep mehr, der Mikro-Ruckler verursacht.',
  },

  // ─── Prepare ───
  restore_point: {
    impact: 0,
    short: 'Sicherheit',
    benefit: 'Erstellt einen Wiederherstellungspunkt, damit du alles rückgängig machen kannst, falls was schiefgeht.',
  },
  pause_updates: {
    impact: 2,
    short: 'Keine Updates reinstören',
    benefit: 'Pausiert Windows-Updates für 365 Tage — kein Update-bedingter FPS-Drop mitten in einer Session.',
  },

  // ─── Extras: Tools & Kosmetik ───
  tool_gamemode: { impact: 0, short: 'Game Mode', benefit: 'Öffnet die Windows Game Mode Einstellungen.' },
  tool_core_isolation: { impact: 0, short: 'Core Isolation', benefit: 'Öffnet die Core Isolation / Memory Integrity Seite.' },
  tool_pointer_precision: { impact: 0, short: 'Maus-Einstellungen', benefit: 'Öffnet die klassische Maus-Systemsteuerung.' },
  tool_resolution: { impact: 0, short: 'Display', benefit: 'Öffnet die Display-Einstellungen für Auflösung/Bildrate.' },
  tool_hags: { impact: 0, short: 'HAGS', benefit: 'Öffnet die Hardware GPU Scheduling Einstellungen.' },
  tool_sound: { impact: 0, short: 'Sound', benefit: 'Öffnet die klassische Sound-Systemsteuerung.' },
  tool_scaling: { impact: 0, short: 'Skalierung', benefit: 'Öffnet die erweiterte Display-Skalierung.' },
  tool_power_plan_cpl: { impact: 0, short: 'Energieoptionen', benefit: 'Öffnet powercfg.cpl (klassische Energieoptionen).' },
  tool_hwinfo: { impact: 0, short: 'HWiNFO', benefit: 'Lädt HWiNFO herunter und startet es — Monitoring-Tool für Temperaturen, Spannungen, FPS.' },
  tool_cpuz: { impact: 0, short: 'CPU-Z', benefit: 'Lädt CPU-Z — zeigt CPU/RAM-Details, wichtig für XMP-Verifikation.' },
  tool_gpuz: { impact: 0, short: 'GPU-Z', benefit: 'Lädt GPU-Z — zeigt Grafikkarten-Details und PCIe-Auslastung.' },
  tool_msi_afterburner: { impact: 0, short: 'MSI Afterburner', benefit: 'Installiert MSI Afterburner + RTSS für GPU-OC und On-Screen-Display.' },
  tool_cru_sre: { impact: 0, short: 'CRU + SRE', benefit: 'Custom Resolution Utility + Scaled Resolution Editor für eigene Auflösungen.' },
  tool_bios: { impact: 0, short: 'Ins BIOS', benefit: 'Rebootet direkt ins BIOS/UEFI.' },
  tool_gaming_installers: { impact: 0, short: 'Launcher', benefit: 'Öffnet die Download-Seiten von Steam, Discord, Battle.net, Epic etc.' },

  // Kosmetik
  taskbar_clean: { impact: 1, short: 'Saubere Taskbar', benefit: 'Entfernt Widgets/Search/TaskView/Chat/Copilot aus der Taskleiste.' },
  start_menu_25h2: { impact: 0, short: 'Neues Startmenü', benefit: 'Aktiviert das neuere 25H2 Startmenü-Layout.' },
  lockscreen_black: { impact: 0, short: 'Schwarzer Lockscreen', benefit: 'Setzt einen schwarzen Lockscreen und Wallpaper.' },
  theme_black: { impact: 0, short: 'Dark Theme', benefit: 'Schaltet das dunkle Theme ein und Transparenz aus.' },
  context_menu_clean: { impact: 1, short: 'Klassisches Kontextmenü', benefit: 'Stellt das alte Win10-Kontextmenü wieder her und entfernt Pin/Share/SendTo.' },
  store_settings_optimize: { impact: 1, short: 'Store optimieren', benefit: 'Deaktiviert Store Auto-Updates, Personalisierung und Video-Autoplay.' },
  widgets_off: { impact: 1, short: 'Widgets aus', benefit: 'Entfernt das Widgets-Panel aus der Taskleiste und stoppt Hintergrundprozesse.' },
  copilot_off: { impact: 1, short: 'Copilot weg', benefit: 'Entfernt die Copilot-AppX und setzt Policy-Keys.' },
  gamebar_off: { impact: 1, short: 'Gamebar/Xbox weg', benefit: 'Deinstalliert Gamebar, Xbox, GameInput und deaktiviert GameDVR-Capture.' },
  loudness_eq_tab: { impact: 0, short: 'Enhancements-Tab', benefit: 'Macht den Enhancements-Tab für Audio-Geräte sichtbar (für Loudness EQ).' },

  // System-Tools
  startup_apps: { impact: 1, short: 'Autostart', benefit: 'Öffnet die Startup-Apps-Verwaltung.' },
  startup_taskmgr: { impact: 0, short: 'Autostart (TaskMgr)', benefit: 'Öffnet den Task-Manager im Autostart-Tab.' },
  region_time: { impact: 0, short: 'Region/Zeit', benefit: 'Öffnet die Region/Zeit/Sprache-Einstellungen.' },
  activation: { impact: 0, short: 'Aktivierung', benefit: 'Öffnet die Windows-Aktivierungs-Seite.' },
  bitlocker_off: { impact: 2, short: 'BitLocker entschlüsseln', benefit: 'Deaktiviert BitLocker auf C: — Performance-Gewinn, aber Verlust der Verschlüsselung.' },
  cleanup_temp: { impact: 1, short: 'Temp aufräumen', benefit: 'Löscht Temp-Ordner, Windows.old, inetpub, PerfLogs und öffnet cleanmgr.' },
  driver_updates_block: { impact: 2, short: 'Treiber-Updates blocken', benefit: 'Verhindert, dass Windows GPU-/Gerätetreiber automatisch überschreibt.' },
  file_download_warning_off: { impact: 0, short: 'Download-Warnung aus', benefit: 'Schaltet die Datei-Download-Sicherheitswarnung ab.' },

  // Driver-Install / DDU
  ddu_driver_clean: { impact: 0, short: 'DDU Treiber-Clean', benefit: 'Lädt DDU, bootet in Safe Mode und clean GPU/Sound-Treiber. Neuinstallation danach nötig.' },
  driver_install_nvidia: { impact: 0, short: 'NVIDIA Treiber', benefit: 'Lädt NVIDIA-Treiber, debloat (entfernt Telemetry/ShadowPlay), installiert + setzt Settings.' },
  driver_install_amd: { impact: 0, short: 'AMD Treiber', benefit: 'Lädt AMD-Treiber, entpackt, debloat, installiert + setzt Adrenalin-Settings.' },
  driver_install_intel: { impact: 0, short: 'Intel Treiber', benefit: 'Lädt Intel-Grafiktreiber, entpackt (--noExtras), installiert + setzt 3DKeys.' },
  rebar_force: { impact: 2, short: 'ReBar Force', benefit: 'Erzwingt Resizable BAR über den NVIDIA Profile Inspector.' },
  intel_settings: { impact: 1, short: 'Intel GPU Settings', benefit: 'VSync via AsyncFlipMode off, Low-Latency-Mode off auf Intel-Adaptern.' },
  edge_removal: { impact: 1, short: 'Edge entfernen', benefit: 'Deinstalliert Edge + WebView hart (Region-Trick, DISM, Service-Deletes).' },
  start_search_mobsync_off: { impact: 1, short: 'Search/Shell deakt.', benefit: 'Verschiebt SystemApps (Search/Shell/StartMenu) heraus, stoppt WSearch.' },

  // Bloatware-Tools
  bloatware_remove_all: { impact: 2, short: 'Alle Bloatware weg', benefit: 'Entfernt UWP-Apps, UWP/Legacy-Features, Legacy-Apps (OneDrive, GameInput etc.).' },
  bloatware_install_store: { impact: 0, short: 'Store neu', benefit: 'Registriert die Store-AppX neu und optimiert Store-Settings.' },
  bloatware_install_uwp_all: { impact: 0, short: 'UWP neu', benefit: 'Registriert alle UWP-Apps neu (restore nach Bloatware-Removal).' },

  // Advanced Module Tweaks
  defender_full_off: { impact: 2, short: 'Defender komplett aus', benefit: 'Deaktiviert Real-Time, Tamper, SmartScreen, VBS, LSA + Defender-Services/Treiber. Tamper vorher manuell aus!' },
  hdcp_off: { impact: 1, short: 'HDCP aus', benefit: 'Schaltet HDCP aus — nützlich bei Capture-Setups oder Kompatibilitätsproblemen.' },
}

// Lookup — null wenn kein Eintrag (UI nutzt dann tweak.title / tweak.summary).
export function benefitOf(tweakId) {
  return BENEFITS[tweakId] || null
}

// Sicherer Fallback mit optionalem Tweak-Objekt.
export function benefitLabel(tweakId, tweak = null) {
  const b = BENEFITS[tweakId]
  return {
    impact: b?.impact ?? 1,
    short: b?.short || tweak?.title || tweakId,
    benefit: b?.benefit || tweak?.summary || 'Windows-Einstellung für Gaming-Performance.',
  }
}

// Impact-Sterne als Unicode.
export function impactStars(impact) {
  if (!impact || impact === 0) return '—'
  return '★'.repeat(impact) + '☆'.repeat(5 - impact)
}
