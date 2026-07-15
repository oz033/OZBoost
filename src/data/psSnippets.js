// =============================================================================
// Inline PowerShell snippets for tweaks that need dynamic registry paths.
//
// Several OZBoost tweaks iterate device/driver registry keys whose names depend
// on the installed hardware, so they cannot be expressed as static `reg`
// actions. Instead we emit PS scriptblocks that do the iteration — mirroring
// the original scripts.
//
// IMPORTANT: these snippets emit human-readable strings via the PowerShell
// pipeline. The runTweak.ps1 runner captures pipeline output and writes each
// line to the log, so we get live progress in the UI without needing access
// to the Write-Log function from inside the scriptblock.
// =============================================================================

const GPU_CLASS_KEY =
  'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'

/**
 * Iterate the GPU driver class subkeys and set `valueName=value` on each.
 * Skips the `Configuration` subkey (matches original ULPS/P0 logic).
 *
 * @param {string} valueName  e.g. 'DisableDynamicPstate'
 * @param {string} value      e.g. '1'
 * @param {string|null} deviceEnumCmd  if set, use Get-PnpDevice instead (MSI Mode)
 * @param {boolean} skipConfiguration  skip the Configuration subkey (default true)
 */
export function gpuSubkeysInlinePs(valueName, value, deviceEnumCmd = null, skipConfiguration = true) {
  if (deviceEnumCmd) {
    return [
      `$devices = ${deviceEnumCmd} | Where-Object { $_.Status -eq 'OK' }`,
      `foreach ($d in $devices) {`,
      `  $p = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($d.InstanceId)\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties"`,
      `  if (Test-Path $p) { Set-ItemProperty -Path $p -Name '${valueName}' -Value ${value} -Type DWord -Force; "set $p = ${value}" }`,
      `}`,
    ].join('\n')
  }
  const filter = skipConfiguration ? `if ($key -notlike '*Configuration')` : ''
  return [
    `$subkeys = (Get-ChildItem -Path '${GPU_CLASS_KEY}' -Force -ErrorAction SilentlyContinue).Name`,
    `foreach ($key in $subkeys) {`,
    `  ${filter} {`,
    `    $p = $key -replace 'HKEY_LOCAL_MACHINE','HKLM:'`,
    `    if (Test-Path $p) { Set-ItemProperty -Path $p -Name '${valueName}' -Value ${value} -Type DWord -Force; "set $p = ${value}" }`,
    `  }`,
    `}`,
  ].join('\n')
}

/**
 * Iterate Device Manager power-management values across ACPI/HID/PCI/USB.
 * Mirrors Ultimate/6 Windows/17 Device Manager Power Savings & Wake.ps1.
 *
 * @param {'off'|'default'} mode
 */
export function devicePowerSavingsInlinePs(mode) {
  // Keys walked: HKLM\SYSTEM\ControlSet001\Enum\{ACPI,HID,PCI,USB}\*\Device Parameters and ...\WDF
  // Values toggled: EnhancedPowerManagementEnabled, SelectiveSuspendEnabled, SelectiveSuspendOn,
  //                 IdleInWorkingState, WaitWakeEnabled
  if (mode === 'off') {
    return [
      `$buses = 'ACPI','HID','PCI','USB'`,
      `$values = @(`,
      `  @{ Path='Device Parameters'; Name='EnhancedPowerManagementEnabled'; Data=0 },`,
      `  @{ Path='Device Parameters'; Name='SelectiveSuspendEnabled'; Data='00'; Bin=$true },`,
      `  @{ Path='Device Parameters'; Name='SelectiveSuspendOn'; Data=0 },`,
      `  @{ Path='WDF'; Name='IdleInWorkingState'; Data=0 },`,
      `  @{ Path='Device Parameters'; Name='WaitWakeEnabled'; Data=0 }`,
      `)`,
      `foreach ($bus in $buses) {`,
      `  $base = "HKLM:\\SYSTEM\\ControlSet001\\Enum\\$bus"`,
      `  $dpKeys = Get-ChildItem -Path $base -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -eq 'Device Parameters' -or $_.PSChildName -eq 'WDF' }`,
      `  foreach ($k in $dpKeys) {`,
      `    $regPath = $k.Name`,
      `    foreach ($v in $values) {`,
      `      if ($v.Bin) { & reg add "$regPath" /v $v.Name /t REG_BINARY /d $v.Data /f 2>$null | Out-Null }`,
      `      else { & reg add "$regPath" /v $v.Name /t REG_DWORD /d $v.Data /f 2>$null | Out-Null }`,
      `    }`,
      `    "tweaked $regPath"`,
      `  }`,
      `}`,
    ].join('\n')
  }
  // default: delete the same values
  return [
    `$buses = 'ACPI','HID','PCI','USB'`,
    `$names = 'EnhancedPowerManagementEnabled','SeleactiveSuspendEnabled','SelectiveSuspendEnabled','SelectiveSuspendOn','IdleInWorkingState','WaitWakeEnabled'`,
    `foreach ($bus in $buses) {`,
    `  $base = "HKLM:\\SYSTEM\\ControlSet001\\Enum\\$bus"`,
    `  $dpKeys = Get-ChildItem -Path $base -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -eq 'Device Parameters' -or $_.PSChildName -eq 'WDF' }`,
    `  foreach ($k in $dpKeys) {`,
    `    $regPath = $k.Name`,
    `    foreach ($n in $names) { & reg delete "$regPath" /v $n /f 2>$null | Out-Null }`,
    `    "reverted $regPath"`,
    `  }`,
    `}`,
  ].join('\n')
}

/**
 * Iterate network-adapter class keys and toggle power-saving + wake values.
 * Mirrors Ultimate/6 Windows/18 Network Adapter Power Savings & Wake.ps1.
 *
 * Class key: {4d36e972-e325-11ce-bfc1-08002be10318}
 */
export function networkAdapterInlinePs(mode) {
  const values = mode === 'off'
    ? [
        ['PnPCapabilities', 'REG_DWORD', '24'],
        ['AdvancedEEE', 'REG_SZ', '0'],
        ['*EEE', 'REG_SZ', '0'],
        ['EEELinkAdvertisement', 'REG_SZ', '0'],
        ['SipsEnabled', 'REG_SZ', '0'],
        ['ULPMode', 'REG_SZ', '0'],
        ['GigaLite', 'REG_SZ', '0'],
        ['EnableGreenEthernet', 'REG_SZ', '0'],
        ['PowerSavingMode', 'REG_SZ', '0'],
        ['S5WakeOnLan', 'REG_SZ', '0'],
        ['*WakeOnMagicPacket', 'REG_SZ', '0'],
        ['*ModernStandbyWoLMagicPacket', 'REG_SZ', '0'],
        ['*WakeOnPattern', 'REG_SZ', '0'],
        ['WakeOnLink', 'REG_SZ', '0'],
      ]
    : []  // default = delete all these names
  const body = mode === 'off'
    ? values.map(([n, t, d]) => `      & reg add "$regPath" /v '${n}' /t ${t} /d '${d}' /f 2>$null | Out-Null`).join('\n')
    : values.length === 0
      ? `      $names = 'PnPCapabilities','AdvancedEEE','*EEE','EEELinkAdvertisement','SipsEnabled','ULPMode','GigaLite','EnableGreenEthernet','PowerSavingMode','S5WakeOnLan','*WakeOnMagicPacket','*ModernStandbyWoLMagicPacket','*WakeOnPattern','WakeOnLink'\n      foreach ($n in $names) { & reg delete "$regPath" /v $n /f 2>$null | Out-Null }`
      : ''
  return [
    `$basePath = 'HKLM:\\System\\ControlSet001\\Control\\Class\\{4d36e972-e325-11ce-bfc1-08002be10318}'`,
    `$adapterKeys = Get-ChildItem -Path $basePath -ErrorAction SilentlyContinue`,
    `foreach ($key in $adapterKeys) {`,
    `  if ($key.PSChildName -match '^\\d{4}$') {`,
    `    $regPath = $key.Name`,
    body,
    `    "tweaked $regPath"`,
    `  }`,
    `}`,
  ].join('\n')
}

/**
 * Toggle Windows write-cache buffer flushing on all SCSI/NVME disks.
 * Mirrors Ultimate/6 Windows/20 Write Cache Buffer Flushing.ps1.
 */
export function writeCacheInlinePs(mode) {
  return [
    `$buses = 'SCSI','NVME'`,
    `foreach ($bus in $buses) {`,
    `  $basePath = "HKLM:\\SYSTEM\\ControlSet001\\Enum\\$bus"`,
    `  Get-ChildItem -Path $basePath -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -eq 'Device Parameters' } | ForEach-Object {`,
    `    $diskPath = (Join-Path $_.PSPath 'Disk') -replace 'Microsoft.PowerShell.Core\\\\Registry::',''`,
    mode === 'off'
      ? `    & reg add "$diskPath" /v 'CacheIsPowerProtected' /t REG_DWORD /d '1' /f 2>$null | Out-Null; "set $diskPath"`
      : `    & reg delete "$diskPath" /f 2>$null | Out-Null; "cleared $diskPath"`,
    `  }`,
    `}`,
  ].join('\n')
}

/**
 * Unhide the Enhancements tab on all audio render devices (Loudness EQ).
 * Mirrors Ultimate/6 Windows/16 Loudness EQ.ps1 — needs audio services stopped.
 *
 * Returns the registry-iteration code; the calling ps_module file handles
 * the service stop/start around it. Exposed as a separate export for reuse.
 */
export const LOUDNESS_EQ_FXPROPID = '{d04e05a6-594b-4fb6-a80d-01af5eed7d1d},3'
export const LOUDNESS_EQ_FXPROVAL = '{5860E1C5-F95C-4a7a-8EC8-8AEF24F379A1}'
