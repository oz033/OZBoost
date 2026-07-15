// =============================================================================
// Additional OZBoost Windows tweaks (update, privacy, UI)
// =============================================================================

const REG_HKLM = 'HKLM'
const REG_HKCU = 'HKCU'

export const WIN11DEBLOAT_TWEAKS = [

  // ────────── Windows Update (high gaming value) ──────────
  {
    id: 'w11d_prevent_update_autoreboot',
    category: 'windows',
    step: 10,
    title: 'Update Auto-Reboot verhindern',
    summary: 'Windows startet nicht automatisch neu, während du eingeloggt bist — schützt vor Reboots mitten im Game.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU', value: 'NoAutoRebootWithLoggedOnUsers', regType: 'REG_DWORD', data: '1' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU', value: 'NoAutoRebootWithLoggedOnUsers', action: 'delete' }],
    },
  },
  {
    id: 'w11d_disable_delivery_optimization',
    category: 'network',
    step: 3,
    title: 'Delivery Optimization aus',
    summary: 'Windows lädt Updates nicht mehr über P2P von anderen PCs — spart CPU und Bandbreite im Hintergrund.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: 'HKU', path: 'S-1-5-20\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Settings', value: 'DownloadMode', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization', value: 'DODownloadMode', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: 'HKU', path: 'S-1-5-20\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Settings', value: 'DownloadMode', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization', value: 'DODownloadMode', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_disable_update_asap',
    category: 'windows',
    step: 11,
    title: 'Early-Updates (Canary) deaktivieren',
    summary: 'Opt-out von kontinuierlichen Innovations-Updates — stabilere Builds für Gaming.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings', value: 'IsContinuousInnovationOptedIn', regType: 'REG_DWORD', data: '0' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings', value: 'IsContinuousInnovationOptedIn', action: 'delete' }],
    },
  },
  {
    id: 'w11d_disable_device_autoapp',
    category: 'windows',
    step: 12,
    title: 'Automatische OEM-App-Installation stoppen',
    summary: 'Verhindert, dass Windows beim Anschließen von Geräten (LG/Dell-Monitore etc.) ungefragt OEM-Tools installiert.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Device Metadata', value: 'PreventDeviceMetadataFromNetwork', regType: 'REG_DWORD', data: '1' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Device Metadata', value: 'PreventDeviceMetadataFromNetwork', action: 'delete' }],
    },
  },

  // ────────── Telemetrie & Scheduled Tasks ──────────
  {
    id: 'w11d_disable_telemetry',
    category: 'debloat',
    step: 10,
    title: 'Telemetrie & Diagnostik-Daten minimieren',
    summary: 'Setzt AllowTelemetry auf 0, schaltet Advertising-ID, Online-Spracherkennung, Inking-Collection und App-Launch-Tracking ab.',
    risk: 'medium',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo', value: 'Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Privacy', value: 'TailoredExperiencesWithDiagnosticDataEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Speech_OneCore\\Settings\\OnlineSpeechPrivacy', value: 'HasAccepted', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Input\\TIPC', value: 'Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\InputPersonalization', value: 'RestrictImplicitInkCollection', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\InputPersonalization', value: 'RestrictImplicitTextCollection', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\InputPersonalization\\TrainedDataStore', value: 'HarvestContacts', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Personalization\\Settings', value: 'AcceptedPrivacyPolicy', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection', value: 'AllowTelemetry', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'Start_TrackProgs', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\System', value: 'PublishUserActivities', regType: 'REG_DWORD', data: '0' },
        // Telemetry scheduled tasks
        { type: 'task', action: 'disable', name: '\\Microsoft\\Windows\\Application Experience\\Microsoft Compatibility Appraiser' },
        { type: 'task', action: 'disable', name: '\\Microsoft\\Windows\\Application Experience\\ProgramDataUpdater' },
        { type: 'task', action: 'disable', name: '\\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator' },
        { type: 'task', action: 'disable', name: '\\Microsoft\\Windows\\Customer Experience Improvement Program\\UsbCeip' },
        { type: 'task', action: 'disable', name: '\\Microsoft\\Windows\\DiskDiagnostic\\Microsoft-Windows-DiskDiagnosticDataCollector' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo', value: 'Enabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection', value: 'AllowTelemetry', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'Start_TrackProgs', action: 'delete' },
        { type: 'task', action: 'enable', name: '\\Microsoft\\Windows\\Application Experience\\Microsoft Compatibility Appraiser' },
        { type: 'task', action: 'enable', name: '\\Microsoft\\Windows\\Application Experience\\ProgramDataUpdater' },
        { type: 'task', action: 'enable', name: '\\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator' },
        { type: 'task', action: 'enable', name: '\\Microsoft\\Windows\\Customer Experience Improvement Program\\UsbCeip' },
        { type: 'task', action: 'enable', name: '\\Microsoft\\Windows\\DiskDiagnostic\\Microsoft-Windows-DiskDiagnosticDataCollector' },
      ],
    },
  },

  // ────────── AI-Blocker (neu bei OZBoost) ──────────
  {
    id: 'w11d_disable_recall',
    category: 'debloat',
    step: 11,
    title: 'Windows Recall / AI-Snapshots deaktivieren',
    summary: 'Blockiert die Aufzeichnung von Screenshots und AI-Datenanalyse vollständig via Policy.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableAIDataAnalysis', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableAIDataAnalysis', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'AllowRecallEnablement', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'TurnOffSavingSnapshots', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_disable_clicktodo',
    category: 'debloat',
    step: 12,
    title: 'Click To Do (AI) deaktivieren',
    summary: 'Schaltet das KI-basierte "Click To Do"-Overlay ab.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableClickToDo', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableClickToDo', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableClickToDo', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI', value: 'DisableClickToDo', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_disable_ai_service',
    category: 'debloat',
    step: 13,
    title: 'Windows AI Fabric Service deaktivieren',
    summary: 'Setzt WSAIFabricSvc auf manuell — verhindert Auto-Start der AI-Infrastruktur.',
    risk: 'medium',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'service', name: 'WSAIFabricSvc', start: '3' }],
      revert: [{ type: 'service', name: 'WSAIFabricSvc', start: '2' }],
    },
  },

  // ────────── Search & Cortana ──────────
  {
    id: 'w11d_disable_bing_search',
    category: 'debloat',
    step: 14,
    title: 'Bing/Cortana in Windows-Suche',
    summary: 'Schaltet Web-Suchvorschläge in der Startmenü-Suche ab und deaktiviert Cortana via Policy.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Policies\\Microsoft\\Windows\\Explorer', value: 'DisableSearchBoxSuggestions', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search', value: 'AllowCortana', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search', value: 'CortanaConsent', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Policies\\Microsoft\\Windows\\Explorer', value: 'DisableSearchBoxSuggestions', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search', value: 'AllowCortana', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search', value: 'CortanaConsent', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_disable_suggestions',
    category: 'debloat',
    step: 15,
    title: 'Windows-Vorschläge & Werbung',
    summary: 'Schaltet ContentDeliveryManager-Vorschläge, "Tipps"-Notifications, Suggested-Apps und Sync-Provider-Werbung ab.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-310093Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-338388Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-338389Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-338393Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-353694Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-353696Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-353698Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SoftLandingEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SilentInstalledAppsEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'ShowSyncProviderNotifications', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'ScoobeSystemSettingEnabled', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-310093Enabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SubscribedContent-338388Enabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'SilentInstalledAppsEnabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager', value: 'ShowSyncProviderNotifications', regType: 'REG_DWORD', data: '1' },
      ],
    },
  },

  // ────────── System ──────────
  {
    id: 'w11d_disable_fast_startup',
    category: 'system',
    step: 9,
    title: 'Fast Startup deaktivieren',
    summary: 'Erzwingt vollständigen Shutdown — sauberer Systemzustand, vermeidet Hybrid-Sleep-Probleme.',
    risk: 'low',
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power', value: 'HiberbootEnabled', regType: 'REG_DWORD', data: '0' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power', value: 'HiberbootEnabled', regType: 'REG_DWORD', data: '1' }],
    },
  },
  {
    id: 'w11d_disable_bitlocker_autoenc',
    category: 'system',
    step: 10,
    title: 'BitLocker Auto-Verschlüsselung verhindern',
    summary: 'Blockiert die automatische Plattenverschlüsselung bei frischen Setups — Performance-Gewinn.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\BitLocker', value: 'PreventDeviceEncryption', regType: 'REG_DWORD', data: '1' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\BitLocker', value: 'PreventDeviceEncryption', action: 'delete' }],
    },
  },
  {
    id: 'w11d_disable_modern_standby_net',
    category: 'network',
    step: 4,
    title: 'Modern-Standby Netzwerkzugriff sperren',
    summary: 'Verhindert Hintergrund-Netzwerk im Connected Standby — Akku-Spark für Laptops.',
    risk: 'medium',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Power\\PowerSettings\\f15576e8-98b7-4186-b944-eafa664402d9', value: 'ACSettingIndex', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Power\\PowerSettings\\f15576e8-98b7-4186-b944-eafa664402d9', value: 'DCSettingIndex', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Power\\PowerSettings\\f15576e8-98b7-4186-b944-eafa664402d9', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_gamebar_url_redirect',
    category: 'windows',
    step: 13,
    title: 'GameBar-Popups unterdrücken (URL-Redirect)',
    summary: 'Leitet ms-gamebar/ms-gamebarservices URLs auf systray.exe um — stoppt Popups auch wenn Gamebar noch installiert ist.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\GameBar', value: 'UseNexusForGameBarEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: 'HKCR', path: 'ms-gamebar\\shell\\open\\command', value: '', regType: 'REG_SZ', data: '%SystemRoot%\\System32\\systray.exe' },
        { type: 'reg', hive: 'HKCR', path: 'ms-gamebarservices\\shell\\open\\command', value: '', regType: 'REG_SZ', data: '%SystemRoot%\\System32\\systray.exe' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\GameBar', value: 'UseNexusForGameBarEnabled', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: 'ms-gamebar', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: 'ms-gamebarservices', action: 'delete' },
      ],
    },
  },

  // ────────── UX Cleanup ──────────
  {
    id: 'w11d_disable_stickykeys',
    category: 'input',
    step: 4,
    title: 'StickyKeys-Shortcut deaktivieren',
    summary: 'Verhindert den StickyKeys-Dialog beim 5-fachen Shift-Drücken (klassischer Gamer-Nerv-Faktor).',
    risk: 'low',
    requiresAdmin: false,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Accessibility\\StickyKeys', value: 'Flags', regType: 'REG_SZ', data: '506' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Accessibility\\StickyKeys', value: 'Flags', regType: 'REG_SZ', data: '510' },
      ],
    },
  },
  {
    id: 'w11d_disable_snap_layouts',
    category: 'windows',
    step: 14,
    title: 'Snap-Layouts deaktivieren',
    summary: 'Schaltet die Snap-Layout-Vorschläge beim Hover über Maximize ab.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'EnableSnapAssistFlyout', regType: 'REG_DWORD', data: '0' }],
      revert: [{ type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'EnableSnapAssistFlyout', regType: 'REG_DWORD', data: '1' }],
    },
  },
  {
    id: 'w11d_enable_end_task',
    category: 'windows',
    step: 15,
    title: '"Task beenden" im Taskbar-Rechtsklick',
    summary: 'Fügt der Taskleisten-Kontextmenü eine direkte "End Task"-Option hinzu (ab Win11 Build 22631).',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\TaskbarDeveloperSettings', value: 'TaskbarEndTask', regType: 'REG_DWORD', data: '1' }],
      revert: [{ type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\TaskbarDeveloperSettings', value: 'TaskbarEndTask', regType: 'REG_DWORD', data: '0' }],
    },
  },

  // ────────── Browser-Anpassungen ──────────
  {
    id: 'w11d_disable_edge_ads',
    category: 'debloat',
    step: 16,
    title: 'Edge-Werbung & Vorschläge',
    summary: '12 Edge-Policies: Shopping-Assistant, New-Tab-Content, Sidebar-Empfehlungen, Wallet-Donation etc. aus.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'NewTabPageContentEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'EdgeShoppingAssistantEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'HubsSidebarEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'ShowRecommendationsEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'SpotlightExperiencesAndRecommendationsEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'ShowAcrobatSubscriptionButton', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', value: 'PersonalizationReportingEnabled', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Edge', action: 'delete' },
      ],
    },
  },
  {
    id: 'w11d_disable_brave_bloat',
    category: 'debloat',
    step: 17,
    title: 'Brave Browser-Bloat',
    summary: 'Deaktiviert Brave VPN, Wallet, AI-Chat, Rewards, Talk, News — 6 Policies auf einmal.',
    risk: 'low',
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveVPNDisabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveWalletDisabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveAIChatEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveRewardsDisabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveTalkDisabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', value: 'BraveNewsDisabled', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\BraveSoftware\\Brave', action: 'delete' },
      ],
    },
  },
]
