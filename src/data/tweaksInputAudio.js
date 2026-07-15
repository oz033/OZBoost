// =============================================================================
// Input & Audio tweaks
// =============================================================================
const REG_HKLM = 'HKLM'
const REG_HKCU = 'HKCU'

export const INPUT_AUDIO_TWEAKS = [
  {
    id: 'keyboard_shortcuts_off',
    category: 'input',
    step: 3,
    title: 'Tastatur-Shortcuts deaktivieren',
    summary: 'Schaltet Win/Alt/Esc/Media-Keys ab, um Tabbing-out zu verhindern. ESC wird auf = gemappt.',
    risk: 'high',
    requiresReboot: true,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Services\\hidserv', value: 'Start', regType: 'REG_DWORD', data: '4' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', value: 'NoWinKeys', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'DisabledHotkeys', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Keyboard Layout', value: 'Scancode Map', regType: 'REG_BINARY', data: '00000000000000000700000000005be000005ce000003800000038e00000010001000d0000000000' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Services\\hidserv', value: 'Start', regType: 'REG_DWORD', data: '3' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', value: 'NoWinKeys', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'DisabledHotkeys', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\CurrentControlSet\\Control\\Keyboard Layout', value: 'Scancode Map', action: 'delete' },
      ],
    },
  },
  {
    id: 'loudness_eq_tab',
    category: 'audio',
    step: 1,
    title: 'Enhancements-Tab anzeigen',
    summary: 'Macht den Enhancements-Tab für alle Audio-Geräte sichtbar (für Loudness EQ etc.).',
    risk: 'medium',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [{ type: 'ps_module', code:
        `Stop-Service audiosrv, AudioEndpointBuilder -Force -ErrorAction SilentlyContinue; ` +
        `$basePath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render'; ` +
        `$guids = Get-ChildItem -Path $basePath -Force -ErrorAction SilentlyContinue; ` +
        `$regContent = "Windows Registry Editor Version 5.00"; ` +
        `foreach ($g in $guids) { $regContent += "\`n[$($g.Name)\\FxProperties]\`n\`"{d04e05a6-594b-4fb6-a80d-01af5eed7d1d},3\`"=\`"{5860E1C5-F95C-4a7a-8EC8-8AEF24F379A1}\`"" }; ` +
        `Set-Content -Path "$env:SystemRoot\\Temp\\loudnesseq.reg" -Value $regContent -Force; ` +
        `regedit /S "$env:SystemRoot\\Temp\\loudnesseq.reg"; ` +
        `Start-Service audiosrv, AudioEndpointBuilder -ErrorAction SilentlyContinue; ` +
        `Start-Process mmsys.cpl; "Enhancements tab unhidden"`
      }],
      revert: [],
    },
  },
]
