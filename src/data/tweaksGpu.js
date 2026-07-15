// =============================================================================
// GPU-vendor tweaks that are too large for inline tweaks.js
// =============================================================================
// AMD/Intel settings iterate the GPU class key with UMD/3DKeys/power_v1
// subpaths and binary reg values — they get their own ps_module files.

const REG_HKCU = 'HKCU'

export const GPU_TWEAKS = [
  {
    id: 'amd_settings',
    category: 'gpu',
    step: 8,
    title: 'AMD Adrenalin optimieren',
    summary: 'VSync aus, Texture-Filter Performance, Tessellation off, Vari-Bright max, Overlay/Tray/Werbung aus.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    gpuVendor: 'amd',
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'ps_module', code: 'Start-Process "$env:SystemDrive\\Program Files\\AMD\\CNext\\CNext\\RadeonSoftware.exe" -ErrorAction SilentlyContinue; Start-Sleep -Seconds 15; Stop-Process -Name RadeonSoftware -Force -ErrorAction SilentlyContinue' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AutoUpdate', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\AIM', value: 'LaunchBugTool', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\DVR', value: 'HotkeysDisabled', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'SystemTray', regType: 'REG_SZ', data: 'false' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\DVR', value: 'ShowRSOverlay', regType: 'REG_SZ', data: 'false' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'RSXBrowserUnavailable', regType: 'REG_SZ', data: 'true' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AllowWebContent', regType: 'REG_SZ', data: 'false' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'CN_Hide_Toast_Notification', regType: 'REG_SZ', data: 'true' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AnimationEffect', regType: 'REG_SZ', data: 'false' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'WizardProfile', regType: 'REG_SZ', data: 'PROFILE_CUSTOM' },
        { type: 'ps_module', code: amdUmdInlinePs('apply') },
      ],
      revert: [
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AutoUpdate', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'SystemTray', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\DVR', value: 'ShowRSOverlay', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AllowWebContent', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'AnimationEffect', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\AMD\\CN', value: 'WizardProfile', action: 'delete' },
        { type: 'ps_module', code: amdUmdInlinePs('revert') },
      ],
    },
  },
  {
    id: 'intel_settings',
    category: 'gpu',
    step: 9,
    title: 'Intel Grafik optimieren',
    summary: 'VSync via AsyncFlipMode off, Low-Latency-Mode off auf allen Intel-Adaptern.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    gpuVendor: 'intel',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code: intel3DKeysInlinePs('apply') }],
      revert: [{ type: 'ps_module', code: intel3DKeysInlinePs('revert') }],
    },
  },
  {
    id: 'rebar_force',
    category: 'gpu',
    step: 10,
    title: 'ReBar Force (NVIDIA Profile Inspector)',
    summary: 'Erzwingt Resizable BAR über den NVIDIA Profile Inspector. Lädt inspector.exe + importiert .nip.',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    requiresInternet: true,
    gpuVendor: 'nvidia',
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', module: 'NVIDIA-ProfileInspector', args: { mode: 'rebar_on' } }],
      revert: [{ type: 'ps_module', module: 'NVIDIA-ProfileInspector', args: { mode: 'rebar_off' } }],
    },
  },
]

// AMD UMD subkey iteration (VSyncControl, TFQ, Tessellation, abmlevel).
function amdUmdInlinePs(mode) {
  const sets = mode === 'apply'
    ? [
        ['UMD', 'VSyncControl', 'REG_BINARY', '3000'],
        ['UMD', 'TFQ', 'REG_BINARY', '3200'],
        ['UMD', 'Tessellation', 'REG_BINARY', '3100'],
        ['UMD', 'Tessellation_OPTION', 'REG_BINARY', '3200'],
        ['power_v1', 'abmlevel', 'REG_BINARY', '00000000'],
      ]
    : [
        ['UMD', 'VSyncControl', 'REG_BINARY', '31000000'],
        ['UMD', 'TFQ', null, null],
        ['UMD', 'Tessellation', 'REG_BINARY', '360034000000'],
        ['UMD', 'Tessellation_OPTION', 'REG_BINARY', '30000000'],
        ['power_v1', 'abmlevel', null, null],
      ]
  const ops = sets.map(([_sub, name, type, data]) => {
    if (type) return `      & reg add "$regPath" /v '${name}' /t ${type} /d '${data}' /f 2>$null | Out-Null`
    return `      & reg delete "$regPath" /v '${name}' /f 2>$null | Out-Null`
  }).join('\n')
  return [
    `$basePath = 'HKLM:\\System\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'`,
    `$allKeys = Get-ChildItem -Path $basePath -Recurse -ErrorAction SilentlyContinue`,
    `$sets = @('UMD','power_v1')`,
    `foreach ($sub in $sets) {`,
    `  $optionKeys = $allKeys | Where-Object { $_.PSChildName -eq $sub }`,
    `  foreach ($key in $optionKeys) {`,
    `    $regPath = $key.Name`,
    ops,
    `    "tweaked $regPath ($sub)"`,
    `  }`,
    `}`,
  ].join('\n')
}

// Intel 3DKeys iteration (Global_AsyncFlipMode, Global_LowLatency).
function intel3DKeysInlinePs(mode) {
  return [
    `$basePath = 'HKLM:\\System\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'`,
    `$adapterKeys = Get-ChildItem -Path $basePath -ErrorAction SilentlyContinue`,
    `foreach ($key in $adapterKeys) {`,
    `  if ($key.PSChildName -match '^\\d{4}$') {`,
    `    $regPath = "$($key.Name)\\3DKeys"`,
    mode === 'apply'
      ? `    & reg add "$regPath" /f 2>$null | Out-Null; & reg add "$regPath" /v 'Global_AsyncFlipMode' /t REG_DWORD /d '2' /f 2>$null | Out-Null; & reg add "$regPath" /v 'Global_LowLatency' /t REG_DWORD /d '0' /f 2>$null | Out-Null; "set $regPath"`
      : `    & reg delete "$regPath" /f 2>$null | Out-Null; "cleared $($key.Name)\\3DKeys"`,
    `  }`,
    `}`,
  ].join('\n')
}
