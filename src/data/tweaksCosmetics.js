// =============================================================================
// Cosmetics tweaks — Taskbar, Start Menu, Lockscreen, Account Pictures
// =============================================================================
const REG_HKLM = 'HKLM'
const REG_HKCU = 'HKCU'

export const COSMETICS_TWEAKS = [
  {
    id: 'taskbar_clean',
    category: 'cosmetics',
    step: 1,
    title: 'Taskleiste aufräumen',
    summary: 'Entfernt Widgets/Search/TaskView/Chat/Copilot, linkes Alignment, zeigt alle Icons.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    recommended: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Dsh', value: 'AllowNewsAndInterests', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'TaskbarAl', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Search', value: 'SearchboxTaskbarMode', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'ShowTaskViewButton', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'TaskbarMn', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'ShowCopilotButton', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\Windows Feeds', value: 'EnableFeeds', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', value: 'HideSCAMeetNow', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer', value: 'EnableAutoTray', regType: 'REG_DWORD', data: '0' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\PolicyManager\\current\\device\\Start', value: 'HideRecommendedSection', regType: 'REG_DWORD', data: '1' },
        { type: 'ps_module', code: 'Stop-Process -Force -Name explorer -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; Start-Process explorer' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Dsh', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'TaskbarAl', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Search', value: 'SearchboxTaskbarMode', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'ShowTaskViewButton', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'TaskbarMn', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', value: 'ShowCopilotButton', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'Software\\Policies\\Microsoft\\Windows\\Windows Feeds', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', action: 'delete' },
        { type: 'ps_module', code: 'Stop-Process -Force -Name explorer -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; Start-Process explorer' },
      ],
    },
  },
  {
    id: 'start_menu_25h2',
    category: 'cosmetics',
    step: 2,
    title: 'Startmenü: 25H2 Layout',
    summary: 'Aktiviert das neuere 25H2-Startmenü und Listen-Ansicht.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\2792562829', value: 'EnabledState', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\3036241548', value: 'EnabledState', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\734731404', value: 'EnabledState', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\762256525', value: 'EnabledState', regType: 'REG_DWORD', data: '2' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Start', value: 'AllAppsViewMode', regType: 'REG_DWORD', data: '2' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\2792562829', value: 'EnabledState', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\3036241548', value: 'EnabledState', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\734731404', value: 'EnabledState', action: 'delete' },
        { type: 'reg', hive: REG_HKLM, path: 'SYSTEM\\ControlSet001\\Control\\FeatureManagement\\Overrides\\14\\762256525', value: 'EnabledState', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Start', value: 'AllAppsViewMode', regType: 'REG_DWORD', data: '0' },
      ],
    },
  },
  {
    id: 'lockscreen_black',
    category: 'cosmetics',
    step: 3,
    title: 'Schwarzer Lockscreen/Wallpaper',
    summary: 'Erzeugt ein schwarzes Hintergrundbild und setzt es als Lockscreen + Wallpaper.',
    risk: 'low',
    requiresReboot: false,
    requiresAdmin: true,
    source: 'OZBoost',
    actions: {
      apply: [
        { type: 'ps_module', code:
          `Add-Type -AssemblyName System.Windows.Forms, System.Drawing; ` +
          `$w = [System.Windows.Forms.SystemInformation]::PrimaryMonitorSize.Width; ` +
          `$h = [System.Windows.Forms.SystemInformation]::PrimaryMonitorSize.Height; ` +
          `$bmp = New-Object System.Drawing.Bitmap $w, $h; ` +
          `$g = [System.Drawing.Graphics]::FromImage($bmp); ` +
          `$g.FillRectangle([System.Drawing.Brushes]::Black, 0, 0, $w, $h); $g.Dispose(); ` +
          `$bmp.Save('C:\\Windows\\Black.jpg'); $bmp.Dispose()`
        },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PersonalizationCSP', value: 'LockScreenImagePath', regType: 'REG_SZ', data: 'C:\\Windows\\Black.jpg' },
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PersonalizationCSP', value: 'LockScreenImageStatus', regType: 'REG_DWORD', data: '1' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Desktop', value: 'Wallpaper', regType: 'REG_SZ', data: 'C:\\Windows\\Black.jpg' },
        { type: 'cmd', command: 'rundll32.exe user32.dll, UpdatePerUserSystemParameters' },
      ],
      revert: [
        { type: 'reg', hive: REG_HKLM, path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PersonalizationCSP', action: 'delete' },
        { type: 'reg', hive: REG_HKCU, path: 'Control Panel\\Desktop', value: 'Wallpaper', regType: 'REG_SZ', data: 'C:\\Windows\\Web\\Wallpaper\\Windows\\img0.jpg' },
        { type: 'cmd', command: 'rundll32.exe user32.dll, UpdatePerUserSystemParameters' },
        { type: 'file', action: 'delete', target: 'C:\\Windows\\Black.jpg' },
      ],
    },
  },
]
