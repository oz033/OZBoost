// =============================================================================
// OZBoost central tweak registry
// =============================================================================
// Each tweak is a self-contained record. The UI renders from this file, the PS
// runner consumes `actions`. `source` is an internal OZBoost tag.
//
// IMPORTANT: tweaks that need GPU-driver-instance iteration (MSI Mode, P0 State,
// ULPS, HDCP) cannot be expressed as static reg paths — the path depends on the
// installed adapter. Those use an inline `ps_module` with `code` that iterates
// the GPU class key.
// =============================================================================

import {
  gpuSubkeysInlinePs,
  devicePowerSavingsInlinePs,
  networkAdapterInlinePs,
  writeCacheInlinePs,
} from './psSnippets'

// Additional tweaks from modular files (kept separate to avoid a 1500-line monolith).
import { GPU_TWEAKS } from './tweaksGpu'
import { COSMETICS_TWEAKS } from './tweaksCosmetics'
import { SYSTEM_TWEAKS } from './tweaksSystem'
import { TOOLS_TWEAKS } from './tweaksTools'
import { INPUT_AUDIO_TWEAKS } from './tweaksInputAudio'
import { ADVANCED_MODULE_TWEAKS } from './tweaksAdvanced'
import { WIN11DEBLOAT_TWEAKS } from './tweaksWin11Debloat'

// Category order for the tools/prepare flow.
export const CATEGORIES = [
  { id: 'prepare',    label: 'Prepare',     icon: 'shield',  hint: 'Backup & System-Checks zuerst' },
  { id: 'gpu',        label: 'GPU',         icon: 'gpu',     hint: 'Treiber-Flags, MSI-Modus, Power-States, ReBar' },
  { id: 'cpu',        label: 'CPU & Latenz', icon: 'cpu',    hint: 'Power Plan, Timer, DEP, Spectre, Affinity' },
  { id: 'display',    label: 'Display',     icon: 'display', hint: 'MPO, Fullscreen Exclusive, Flip, Scaling' },
  { id: 'input',      label: 'Input',       icon: 'mouse',   hint: 'Maus-Precision, Polling, Keyboard' },
  { id: 'audio',      label: 'Audio',       icon: 'settings',hint: 'Enhancements, Loudness EQ' },
  { id: 'storage',    label: 'Storage',     icon: 'storage', hint: 'Festplatten-Write-Cache, USB-Power' },
  { id: 'network',    label: 'Network',     icon: 'network', hint: 'Adapter-Stromsparen, IPv4-Only' },
  { id: 'windows',    label: 'Windows',     icon: 'display', hint: 'Memory, Background, Core Isolation, Startup' },
  { id: 'debloat',    label: 'Debloat',     icon: 'trash',   hint: 'Widgets, Copilot, Gamebar, Edge, Bloatware' },
  { id: 'cosmetics',  label: 'Cosmetics',   icon: 'sparkles',hint: 'Theme, Taskbar, Start Menu, Lockscreen' },
  { id: 'system',     label: 'System',      icon: 'settings',hint: 'BitLocker, Activation, Region, Services' },
  { id: 'tools',      label: 'Tools',       icon: 'sliders', hint: 'HWiNFO, CPU-Z, MSI Afterburner, CRU etc.' },
  { id: 'advanced',   label: 'Advanced',    icon: 'warning', hint: 'Defender, Firewall, Services-Off, risky' },
]

const REG_HKLM = 'HKLM'
const REG_HKCU = 'HKCU'

// Core tweaks defined inline in this file. Extended tweaks live in separate
// modules (tweaksGpu.js, tweaksCosmetics.js, ...) and are merged below.
const _CORE_TWEAKS = [

  // ───────────────────────── Prepare ─────────────────────────
  {
    id: 'restore_point',
    category: 'prepare',
    step: 1,
    title: 'Systemwiederherstellungspunkt',
    summary: 'Erstellt einen Restore Point, bevor irgendwelche Tweaks angewendet werden.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      // Apply creates the point; revert is a no-op (we don't auto-delete backups).
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore', value: 'SystemRestorePointCreationFrequency', regType: 'REG_DWORD', data: '0' },
        { type: 'ps_module', code: 'Enable-ComputerRestore -Drive "C:\\"' },
        { type: 'ps_module', code: 'Checkpoint-Computer -Description "OZBoost pre-tweak" -RestorePointType "MODIFY_SETTINGS"' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore', value: 'SystemRestorePointCreationFrequency', action: 'delete' },
      ],
      revert: [],
    },
  },
  {
    id: 'pause_updates',
    category: 'prepare',
    step: 2,
    title: 'Windows Updates pausieren (365 Tage)',
    summary: 'Verhindert, dass Windows Updates GPU-Treiber überschreibt oder FPS-Drops verursacht.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'ps_module', code:
          `$pause = (Get-Date).AddDays(365).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); ` +
          `$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); ` +
          `$p = 'HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings'; ` +
          `Set-ItemProperty -Path $p -Name 'PauseUpdatesExpiryTime' -Value $pause -Force; ` +
          `Set-ItemProperty -Path $p -Name 'PauseFeatureUpdatesEndTime' -Value $pause -Force; ` +
          `Set-ItemProperty -Path $p -Name 'PauseFeatureUpdatesStartTime' -Value $today -Force; ` +
          `Set-ItemProperty -Path $p -Name 'PauseQualityUpdatesEndTime' -Value $pause -Force; ` +
          `Set-ItemProperty -Path $p -Name 'PauseQualityUpdatesStartTime' -Value $today -Force; ` +
          `Set-ItemProperty -Path $p -Name 'PauseUpdatesStartTime' -Value $today -Force`
        },
      ],
      revert: [
        { type: 'ps_module', code:
          `$p = 'HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings'; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseUpdatesExpiryTime' -ErrorAction SilentlyContinue; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseFeatureUpdatesEndTime' -ErrorAction SilentlyContinue; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseFeatureUpdatesStartTime' -ErrorAction SilentlyContinue; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseQualityUpdatesEndTime' -ErrorAction SilentlyContinue; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseQualityUpdatesStartTime' -ErrorAction SilentlyContinue; ` +
          `Remove-ItemProperty -Path $p -Name 'PauseUpdatesStartTime' -ErrorAction SilentlyContinue`
        },
      ],
    },
  },

  // ───────────────────────── GPU ─────────────────────────
  {
    id: 'msi_mode',
    category: 'gpu',
    step: 3,
    title: 'MSI Mode (Message Signaled Interrupts)',
    summary: 'Aktiviert MSI für alle Grafikkarten — reduziert CPU-Interrupt-Overhead und Latenz.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    gpuVendor: 'any',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: gpuSubkeysInlinePs('MSISupported', '1', 'Get-PnpDevice -Class Display') }],
      revert: [{ type: 'ps_module', code: gpuSubkeysInlinePs('MSISupported', '0', 'Get-PnpDevice -Class Display') }],
    },
  },
  {
    id: 'p0_state',
    category: 'gpu',
    step: 4,
    title: 'P0 State (NVIDIA Max Boost)',
    summary: 'Erzwingt den höchsten Performance-Power-State — GPU takten nicht mehr ab.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    gpuVendor: 'nvidia',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: gpuSubkeysInlinePs('DisableDynamicPstate', '1') }],
      revert: [{ type: 'ps_module', code: gpuSubkeysInlinePs('DisableDynamicPstate', '0') }],
    },
  },
  {
    id: 'ulps_off',
    category: 'gpu',
    step: 5,
    title: 'AMD ULPS deaktivieren',
    summary: 'Schaltet Ultra-Low-Power-State ab — verhindert GPU-Wakeup-Latenz.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    gpuVendor: 'amd',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: gpuSubkeysInlinePs('EnableUlps', '0', null, true) }],
      revert: [{ type: 'ps_module', code: gpuSubkeysInlinePs('EnableUlps', '1', null, true) }],
    },
  },
  {
    id: 'hdcp_off',
    category: 'gpu',
    step: 6,
    title: 'HDCP deaktivieren (NVIDIA)',
    summary: 'Schaltet HDCP aus — nützlich bei Capture-Setups oder Kompatibilitätsproblemen.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    gpuVendor: 'nvidia',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: gpuSubkeysInlinePs('RMHdcpKeyglobZero', '1') }],
      revert: [{ type: 'ps_module', code: gpuSubkeysInlinePs('RMHdcpKeyglobZero', '0') }],
    },
  },
  {
    id: 'nvidia_settings',
    category: 'gpu',
    step: 7,
    title: 'NVIDIA Treiber-Optimierungen',
    summary: 'PhysX auf GPU, DevTools sichtbar, Performance-Counter frei, Tray aus, Legacy-Sharpen an.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    requiresInternet: true,
    gpuVendor: 'nvidia',
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'NvCplPhysxAuto', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'NvDevToolsVisible', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'RmProfilingAdminOnly', regType: 'REG_DWORD', data: '0' },
        { type: 'ps_module', code: gpuSubkeysInlinePs('RmProfilingAdminOnly', '0') },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\NVIDIA Corporation\\NvTray', value: 'StartOnLogin', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Services\\nvlddmkm\\FTS', value: 'EnableGR535', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Services\\nvlddmkm\\Parameters\\FTS', value: 'EnableGR535', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'NvCplPhysxAuto', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'NvDevToolsVisible', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\nvlddmkm\\Parameters\\Global\\NVTweak', value: 'RmProfilingAdminOnly', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\NVIDIA Corporation\\NvTray', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Services\\nvlddmkm\\FTS', value: 'EnableGR535', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Services\\nvlddmkm\\Parameters\\FTS', value: 'EnableGR535', regType: 'REG_DWORD', data: '1' },
      ],
    },
  },

  // ───────────────────────── CPU & Latency ─────────────────────────
  {
    id: 'power_plan',
    category: 'cpu',
    step: 7,
    title: 'Ultimate Performance Power Plan',
    summary: 'Aktiviert den versteckten Ultimate-Plan, entparkt CPU-Cores und schaltet Stromsparen ab.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'cmd', command: 'powercfg /duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 99999999-9999-9999-9999-999999999999' },
        { type: 'cmd', command: 'powercfg /SETACTIVE 99999999-9999-9999-9999-999999999999' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Power', value: 'HibernateEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Power', value: 'HibernateEnabledDefault', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings', value: 'ShowSleepOption', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power', value: 'HiberbootEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling', value: 'PowerThrottlingOff', regType: 'REG_DWORD', data: '1' },
        // Unpark cores.
        { type: 'powercfg', plan: '99999999-9999-9999-9999-999999999999', subgroup: '54533251-82be-4824-96c1-47b60b740d00', setting: '0cc5b647-c1df-4637-891a-dec35c318583', ac: '0x64', dc: '0x64' },
        { type: 'powercfg', plan: '99999999-9999-9999-9999-999999999999', subgroup: '54533251-82be-4824-96c1-47b60b740d00', setting: 'ea062031-0e34-4ff1-9b6d-eb1059334028', ac: '0x64', dc: '0x64' },
        { type: 'powercfg', plan: '99999999-9999-9999-9999-999999999999', subgroup: '54533251-82be-4824-96c1-47b60b740d00', setting: '893dee8e-2bef-41e0-89c6-b55d0929964c', ac: '0x64', dc: '0x64' },
        { type: 'powercfg', plan: '99999999-9999-9999-9999-999999999999', subgroup: '54533251-82be-4824-96c1-47b60b740d00', setting: 'bc5038f7-23e0-4960-96da-33abaf5935ec', ac: '0x64', dc: '0x64' },
        { type: 'cmd', command: 'powercfg /hibernate off' },
      ],
      revert: [
        { type: 'cmd', command: 'powercfg -restoredefaultschemes' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Power', value: 'HibernateEnabled', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling', action: 'delete' },
        { type: 'cmd', command: 'powercfg /hibernate on' },
      ],
    },
  },
  {
    id: 'timer_resolution',
    category: 'cpu',
    step: 8,
    title: 'Timer Resolution Service',
    summary: 'Installiert den STR-Service für 0.5ms Timer-Auflösung — senkt Input-Lag spürbar.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'ps_module', module: 'Timer-Resolution', args: { mode: 'on' } },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel', value: 'GlobalTimerResolutionRequests', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'ps_module', module: 'Timer-Resolution', args: { mode: 'off' } },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel', value: 'GlobalTimerResolutionRequests', action: 'delete' },
      ],
    },
  },
  {
    id: 'dep_off',
    category: 'cpu',
    step: 9,
    title: 'Data Execution Prevention (DEP) aus',
    summary: 'Schaltet DEP via bcdedit ab. ⚠ Secure Boot muss OFF sein. Wirkt nach Reboot.',
    risk: 'high',
    requiresReboot: true,
    requiresAdmin: true,
    requiresSecureBootOff: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'cmd', command: 'bcdedit /set nx AlwaysOff' }],
      revert: [{ type: 'cmd', command: 'bcdedit /deletevalue nx' }],
    },
  },
  {
    id: 'spectre_meltdown_off',
    category: 'cpu',
    step: 10,
    title: 'Spectre / Meltdown Mitigations aus',
    summary: 'Deaktiviert CPU-Security-Mitigations für mehr Performance (Sicherheitsrisiko!).',
    risk: 'low',
    requiresReboot: true,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\Session Manager\\Memory Management', value: 'FeatureSettingsOverrideMask', regType: 'REG_DWORD', data: '3' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\Session Manager\\Memory Management', value: 'FeatureSettingsOverride', regType: 'REG_DWORD', data: '3' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\Session Manager\\Memory Management', value: 'FeatureSettingsOverrideMask', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\Session Manager\\Memory Management', value: 'FeatureSettingsOverride', action: 'delete' },
      ],
    },
  },

  // ───────────────────────── Display ─────────────────────────
  {
    id: 'mpo_off',
    category: 'display',
    step: 11,
    title: 'Multiplane Overlay (MPO) aus',
    summary: 'Deaktiviert MPO — fixt häufiges Flackern und FPS-Drops im Windowed-Modus.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\Dwm', value: 'OverlayTestMode', regType: 'REG_DWORD', data: '5' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\DirectX\\UserGpuPreferences', value: 'DirectXUserGlobalSettings', regType: 'REG_SZ', data: 'VRROptimizeEnable=0;SwapEffectUpgradeEnable=0;' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\Dwm', value: 'OverlayTestMode', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\DirectX\\UserGpuPreferences', value: 'DirectXUserGlobalSettings', regType: 'REG_SZ', data: 'VRROptimizeEnable=0;SwapEffectUpgradeEnable=1;' },
      ],
    },
  },
  {
    id: 'fullscreen_exclusive',
    category: 'display',
    step: 12,
    title: 'Fullscreen Exclusive (FSE)',
    summary: 'Erzwingt echten Fullscreen Exclusive statt FSO. ⚠ DX12 unterstützt FSE nicht.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_DXGIHonorFSEWindowsCompatible', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_FSEBehaviorMode', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_FSEBehavior', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_HonorUserFSEBehaviorMode', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_DXGIHonorFSEWindowsCompatible', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_FSEBehaviorMode', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_FSEBehavior', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_HonorUserFSEBehaviorMode', regType: 'REG_DWORD', data: '0' },
      ],
    },
  },
  {
    id: 'independent_flip',
    category: 'display',
    step: 13,
    title: 'Hardware Composed Independent Flip',
    summary: 'Erzwingt den direkten Flip-Pfad für niedrigere Display-Latenz.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\\Scheduler', value: 'ForceFlipTrueImmediateMode', regType: 'REG_DWORD', data: '1' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\\Scheduler', action: 'delete' }],
    },
  },

  // ───────────────────────── Input ─────────────────────────
  {
    id: 'pointer_precision_off',
    category: 'input',
    step: 14,
    title: 'Pointer Precision (Mausbeschleunigung) aus',
    summary: 'Deaktiviert "Enhance Pointer Precision" für raw aim — essentiell für FPS.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: false,
    recommended: true,
    source: 'OZBoost',
    actions: {
      // Opens Mouse Properties — actual toggle is a manual checkbox because the
      // SmoothMouseXCurve binary is the canonical way. For the MVP we set the
      // registry bits directly to disable acceleration.
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseSpeed', regType: 'REG_SZ', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseThreshold1', regType: 'REG_SZ', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseThreshold2', regType: 'REG_SZ', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseSpeed', regType: 'REG_SZ', data: '2' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseThreshold1', regType: 'REG_SZ', data: '6' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'MouseThreshold2', regType: 'REG_SZ', data: '10' },
      ],
    },
  },
  {
    id: 'polling_cap_off',
    category: 'input',
    step: 15,
    title: 'Background Polling Rate Cap aus',
    summary: 'Verhindert, dass Windows die Maus-Polling-Rate im Hintergrund drosselt.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: false,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'RawMouseThrottleEnabled', regType: 'REG_DWORD', data: '0' }],
      revert: [{ type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Mouse', value: 'RawMouseThrottleEnabled', action: 'delete' }],
    },
  },

  // ───────────────────────── Windows ─────────────────────────
  {
    id: 'memory_compression_off',
    category: 'windows',
    step: 16,
    title: 'Memory Compression aus',
    summary: 'Schaltet die RAM-Kompression ab — reduziert CPU-Overhead, kostet RAM.',
    risk: 'medium',
    requiresReboot: true,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: 'Disable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue' }],
      revert: [{ type: 'ps_module', code: 'Enable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue' }],
    },
  },
  {
    id: 'background_apps_off',
    category: 'windows',
    step: 17,
    title: 'Background Apps aus',
    summary: 'Verbietet UWP-Apps, im Hintergrund zu laufen — spart CPU/RAM.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy', value: 'LetAppsRunInBackground', regType: 'REG_DWORD', data: '2' }],
      revert: [{ type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy', value: 'LetAppsRunInBackground', action: 'delete' }],
    },
  },
  {
    id: 'core_isolation_off',
    category: 'windows',
    step: 18,
    title: 'Core Isolation / VBS aus',
    summary: 'Deaktiviert Memory Integrity (HVCI) — messbarer FPS-Gewinn, Sicherheitsrisiko.',
    risk: 'medium',
    requiresReboot: true,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity', value: 'Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Lsa', value: 'LsaCfgFlags', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity', value: 'Enabled', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Lsa', value: 'LsaCfgFlags', action: 'delete' },
      ],
    },
  },

  // ───────────────────────── Advanced ─────────────────────────
  {
    id: 'defender_realtime_off',
    category: 'advanced',
    step: 19,
    title: 'Defender Real-Time Protection aus',
    summary: '⚠ Hochriskant. Schaltet Real-Time-Scan ab. Nur für isolierte Gaming-PCs ohne Download-Risiko.',
    risk: 'high',
    requiresReboot: false,
    requiresAdmin: true,
    requiresTamperOff: true,
    source: 'OZBoost',
    actions: {
      // Simplified path: full Defender-disable via OZBoost needs Safe Boot.
      // For the MVP we expose only the HKLM Real-Time key — Tamper Protection
      // must be turned off manually in Windows Security first.
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows Defender\\Real-Time Protection', value: 'DisableRealtimeMonitoring', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows Defender', value: 'DisableAntiSpyware', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows Defender\\Real-Time Protection', value: 'DisableRealtimeMonitoring', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows Defender', value: 'DisableAntiSpyware', action: 'delete' },
      ],
    },
  },

  // ───────────────────────── Storage ─────────────────────────
  {
    id: 'write_cache_off',
    category: 'storage',
    step: 1,
    title: 'Write-Cache Buffer Flushing aus',
    summary: 'Schaltet Buffer-Flushing auf allen SCSI/NVME-Laufwerken ab — schnelleres Schreiben.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: writeCacheInlinePs('off') }],
      revert: [{ type: 'ps_module', code: writeCacheInlinePs('default') }],
    },
  },
  {
    id: 'device_power_savings_off',
    category: 'storage',
    step: 2,
    title: 'Device-Manager Stromsparen aus',
    summary: 'Deaktiviert USB/PCI/HID-Stromsparen und Selective Suspend auf allen Geräten.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: devicePowerSavingsInlinePs('off') }],
      revert: [{ type: 'ps_module', code: devicePowerSavingsInlinePs('default') }],
    },
  },

  // ───────────────────────── Network ─────────────────────────
  {
    id: 'network_adapter_power_off',
    category: 'network',
    step: 1,
    title: 'Netzwerkadapter Stromsparen aus',
    summary: 'Deaktiviert Energy-Efficient-Ethernet, Green-Ethernet, Wake-on-LAN auf allen Adaptern.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: networkAdapterInlinePs('off') }],
      revert: [{ type: 'ps_module', code: networkAdapterInlinePs('default') }],
    },
  },
  {
    id: 'network_ipv4_only',
    category: 'network',
    step: 2,
    title: 'Nur IPv4 (restliche Bindungen aus)',
    summary: 'Deaktiviert IPv6, LLDP, QoS, File/Print-Bindings — senkt Netzwerk-Overhead.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'net_binding', action: 'disable', components: ['ms_lldp', 'ms_lltdio', 'ms_implat', 'ms_rspndr', 'ms_tcpip6', 'ms_server', 'ms_msclient', 'ms_pacer'] }],
      revert: [{ type: 'net_binding', action: 'enable', components: ['ms_lldp', 'ms_lltdio', 'ms_implat', 'ms_rspndr', 'ms_tcpip6', 'ms_server', 'ms_msclient', 'ms_pacer'] }],
    },
  },

  // ───────────────────────── Debloat ─────────────────────────
  {
    id: 'widgets_off',
    category: 'debloat',
    step: 1,
    title: 'Widgets / News and Interests aus',
    summary: 'Entfernt das Widgets-Panel aus der Taskleiste und stoppt die Hintergrundprozesse.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\PolicyManager\\default\\NewsAndInterests\\AllowNewsAndInterests', value: 'value', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Dsh', value: 'AllowNewsAndInterests', regType: 'REG_DWORD', data: '0' },
        { type: 'ps_module', code: 'Stop-Process -Force -Name Widgets,WidgetService -ErrorAction SilentlyContinue' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\PolicyManager\\default\\NewsAndInterests\\AllowNewsAndInterests', value: 'value', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Dsh', action: 'delete' },
      ],
    },
  },
  {
    id: 'copilot_off',
    category: 'debloat',
    step: 2,
    title: 'Copilot deinstallieren',
    summary: 'Entfernt die Copilot-AppX und setzt die Policy-Regkeys zum Deaktivieren.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'appx', action: 'remove', name: '*Copilot*' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsCopilot', value: 'TurnOffWindowsCopilot', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot', value: 'TurnOffWindowsCopilot', regType: 'REG_DWORD', data: '1' },
      ],
      revert: [
        { type: 'appx', action: 'register', name: '*Copilot*' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsCopilot', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot', action: 'delete' },
      ],
    },
  },
  {
    id: 'gamebar_off',
    category: 'debloat',
    step: 3,
    title: 'Gamebar / Xbox-Apps entfernen',
    summary: 'Deinstalliert Gamebar, Xbox, GameInput und deaktiviert GameDVR-Capture.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'System\\GameConfigStore', value: 'GameDVR_Enabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR', value: 'AppCaptureEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\GameBar', value: 'UseNexusForGameBarEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\GameBar', value: 'GamepadNexusChordEnabled', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\WindowsRuntime\\ActivatableClassId\\Windows.Gaming.GameBar.PresenceServer.Internal.PresenceWriter', value: 'ActivationType', regType: 'REG_DWORD', data: '0' },
        { type: 'appx', action: 'remove', name: '*Gaming*' },
        { type: 'appx', action: 'remove', name: '*Xbox*' },
      ],
      revert: [
        { type: 'appx', action: 'register', name: '*Gaming*' },
        { type: 'appx', action: 'register', name: '*Xbox*' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\WindowsRuntime\\ActivatableClassId\\Windows.Gaming.GameBar.PresenceServer.Internal.PresenceWriter', value: 'ActivationType', regType: 'REG_DWORD', data: '1' },
      ],
    },
  },
  {
    id: 'context_menu_clean',
    category: 'debloat',
    step: 4,
    title: 'Kontextmenü aufräumen (klassisch)',
    summary: 'Stellt das alte Win10-Kontextmenü wieder her und entfernt Pin/Share/SendTo-Einträge.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32', value: '', regType: 'REG_SZ', data: '' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', value: 'NoCustomizeThisFolder', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: 'HKCR', path: 'Folder\\shell\\pintohome', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: '*\\shell\\pintohomefile', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: 'exefile\\shellex\\ContextMenuHandlers\\Compatibility', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Shell Extensions\\Blocked', value: '{9F156763-7844-4DC4-B2B1-901F640F5155}', regType: 'REG_SZ', data: '' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Shell Extensions\\Blocked', value: '{09A47860-11B0-4DA5-AFA5-26D86198A780}', regType: 'REG_SZ', data: '' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Shell Extensions\\Blocked', value: '{f81e9010-6ea4-11ce-a7ff-00aa003ca9f6}', regType: 'REG_SZ', data: '' },
        { type: 'reg', hive: 'HKCR', path: 'Folder\\ShellEx\\ContextMenuHandlers\\Library Location', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: 'AllFilesystemObjects\\shellex\\ContextMenuHandlers\\ModernSharing', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer', value: 'NoPreviousVersionsPage', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: 'HKCR', path: 'AllFilesystemObjects\\shellex\\ContextMenuHandlers\\SendTo', action: 'delete' },
        { type: 'reg', hive: 'HKCR', path: 'UserLibraryFolder\\shellex\\ContextMenuHandlers\\SendTo', action: 'delete' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', value: 'NoCustomizeThisFolder', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Shell Extensions\\Blocked', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer', value: 'NoPreviousVersionsPage', action: 'delete' },
      ],
    },
  },
  {
    id: 'store_settings_optimize',
    category: 'debloat',
    step: 5,
    title: 'Microsoft Store optimieren',
    summary: 'Deaktiviert Auto-Updates, Personalisierung, Video-Autoplay und App-Install-Notifications.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsStore\\WindowsUpdate', value: 'AutoDownload', regType: 'REG_DWORD', data: '2' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsStore', action: 'delete' },
      ],
    },
  },
  {
    id: 'theme_black',
    category: 'debloat',
    step: 6,
    title: 'Dark Theme erzwingen',
    summary: 'Schaltet das dunkle Theme ein und Transparenz aus — Cosmetics.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'AppsUseLightTheme', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'ColorPrevalence', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'EnableTransparency', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'SystemUsesLightTheme', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'AppsUseLightTheme', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'AppsUseLightTheme', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'ColorPrevalence', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'EnableTransparency', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', value: 'SystemUsesLightTheme', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', action: 'delete' },
      ],
    },
  },

  // ───────────────────────── Advanced (zusätzlich) ─────────────────────────
  {
    id: 'driver_updates_block',
    category: 'advanced',
    step: 20,
    title: 'Windows-Treiber-Updates blocken',
    summary: 'Verhindert, dass Windows GPU-/Gerätetreiber automatisch überschreibt. ⚠ Pro/LTSC/IoT nur.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceMetadata', value: 'PreventDeviceMetadataFromNetwork', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceInstall\\Settings', value: 'DisableSendGenericDriverNotFoundToWER', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceInstall\\Settings', value: 'DisableSendRequestAdditionalSoftwareToWER', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DriverSearching', value: 'SearchOrderConfig', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsUpdate', value: 'ExcludeWUDriversInQualityUpdate', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU', value: 'IncludeRecommendedUpdates', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceMetadata', value: 'PreventDeviceMetadataFromNetwork', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceInstall\\Settings', value: 'DisableSendGenericDriverNotFoundToWER', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DeviceInstall\\Settings', value: 'DisableSendRequestAdditionalSoftwareToWER', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\DriverSearching', value: 'SearchOrderConfig', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsUpdate', value: 'ExcludeWUDriversInQualityUpdate', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU', value: 'IncludeRecommendedUpdates', action: 'delete' },
      ],
    },
  },
  {
    id: 'firewall_off',
    category: 'advanced',
    step: 21,
    title: 'Windows Firewall aus',
    summary: 'Deaktiviert die Firewall für Public + Standard Profile. ⚠ Nur hinter eigener Hardware-Firewall.',
    risk: 'high',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\PublicProfile', value: 'EnableFirewall', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\StandardProfile', value: 'EnableFirewall', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\PublicProfile', value: 'EnableFirewall', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'System\\ControlSet001\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\StandardProfile', value: 'EnableFirewall', regType: 'REG_DWORD', data: '1' },
      ],
    },
  },
  {
    id: 'mmagent_off',
    category: 'advanced',
    step: 22,
    title: 'MMAgent Features aus (Prefetch/PreLaunch)',
    summary: 'Deaktiviert Prefetcher, ApplicationPreLaunch, OperationAPI, PageCombining — reduziert Background-Disk-IO.',
    risk: 'medium',
    requiresReboot: true,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters', value: 'EnablePrefetcher', regType: 'REG_DWORD', data: '0' },
        { type: 'ps_module', code: 'Disable-MMAgent -ApplicationLaunchPrefetching -ApplicationPreLaunch -MemoryCompression -OperationAPI -PageCombining -ErrorAction SilentlyContinue; Set-MMAgent -MaxOperationAPIFiles 1 -ErrorAction SilentlyContinue' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters', value: 'EnablePrefetcher', regType: 'REG_DWORD', data: '3' },
        { type: 'ps_module', code: 'Enable-MMAgent -ApplicationLaunchPrefetching -ApplicationPreLaunch -OperationAPI -ErrorAction SilentlyContinue; Set-MMAgent -MaxOperationAPIFiles 512 -ErrorAction SilentlyContinue' },
      ],
    },
  },
  {
    id: 'file_download_warning_off',
    category: 'advanced',
    step: 23,
    title: 'Datei-Download-Warnung aus',
    summary: 'Schaltet die "Datei herunterladen - Sicherheitswarnung" für Zone 3 ab.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Security', value: 'DisableSecuritySettingsCheck', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3', value: '1806', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3', value: '1806', regType: 'REG_DWORD', data: '0' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Policies\\Microsoft\\Internet Explorer', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3', value: '1806', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3', value: '1806', regType: 'REG_DWORD', data: '1' },
      ],
    },
  },
]

// Convenience lookups used by the UI.
// Merge core TWEAKS with the modular tweak files so the UI sees one list.
export const TWEAKS = [
  ..._CORE_TWEAKS,
  ...GPU_TWEAKS,
  ...COSMETICS_TWEAKS,
  ...SYSTEM_TWEAKS,
  ...TOOLS_TWEAKS,
  ...INPUT_AUDIO_TWEAKS,
  ...ADVANCED_MODULE_TWEAKS,
  ...WIN11DEBLOAT_TWEAKS,
]

export const TWEAKS_BY_ID = Object.fromEntries(TWEAKS.map((t) => [t.id, t]))
export const TWEAKS_BY_CATEGORY = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = TWEAKS.filter((t) => t.category === c.id).sort((a, b) => a.step - b.step)
  return acc
}, {})

// Hashtags for filtering in the dashboard.
export const RECOMMENDED_TWEAKS = TWEAKS.filter((t) => t.recommended)
