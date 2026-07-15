#Requires -Version 5.1
<#
    Microsoft Store settings optimizer / reset.
    Transcribed from Ultimate/3 Setup/11 Store Settings.ps1.

    The original loads the Store's per-user settings hive, imports a .reg
    file that disables PersonalizationEnabled / VideoAutoplay /
    EnableAppInstallNotifications, then unloads the hive. It also sets
    AutoDownload=2 to disable automatic app updates. The 'default' path
    re-enables updates and wsresets the store.

    mode:
      optimize -> original menu option 1
      default  -> original menu option 2
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$mode = $PayloadArgs.mode  # 'optimize' | 'default'

switch ($mode) {

    'optimize' {

        & $WriteLog '[store] optimize: open settings page so personalized-experiences disable sticks'
        try {
            Start-Process 'ms-windows-store:settings'
        } catch { }
        Start-Sleep -Seconds 5

        # stop store running
        $stop = 'WinStore.App', 'backgroundTaskHost', 'StoreDesktopExtension'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2

        # disable apps updates
        & $WriteLog '[store] disable auto app updates (AutoDownload=2)'
        & cmd /c 'reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsStore\WindowsUpdate" /v "AutoDownload" /t REG_DWORD /d "2" /f >nul 2>&1'

        # create reg file
        $storesettings = @'
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\Settings\LocalState]
; disable video autoplay
"VideoAutoplay"=hex(5f5e10b):00,96,9d,69,8d,cd,93,dc,01
; disable notifications for app installations
"EnableAppInstallNotifications"=hex(5f5e10b):00,36,d0,88,8e,cd,93,dc,01

[HKEY_LOCAL_MACHINE\Settings\LocalState\PersistentSettings]
; disable personalized experiences
"PersonalizationEnabled"=hex(5f5e10b):00,0d,56,a1,8a,cd,93,dc,01
'@
        Set-Content -Path "$env:SystemRoot\Temp\windowsstore.reg" -Value $storesettings -Force
        $settingsdat = "$env:LocalAppData\Packages\Microsoft.WindowsStore_8wekyb3d8bbwe\Settings\settings.dat"
        $regfilewindowsstore = "$env:SystemRoot\Temp\windowsstore.reg"

        & $WriteLog '[store] load settings hive + import reg file'
        # load hive
        reg load 'HKLM\Settings' $settingsdat >$null 2>&1

        # import reg file
        if ($LASTEXITCODE -eq 0) {
            reg import $regfilewindowsstore >$null 2>&1

            # unload hive
            [gc]::Collect()
            Start-Sleep -Seconds 2
            reg unload 'HKLM\Settings' >$null 2>&1
        } else {
            & $WriteLog '[store] could not load settings hive (store not installed yet?) — skipping import'
        }
        Start-Sleep -Seconds 2

        # open store settings
        Start-Process 'ms-windows-store:settings'

        & $WriteLog '[store] optimize complete'
    }

    'default' {

        & $WriteLog '[store] default: re-enable app updates + reset store'

        # enable apps updates
        & cmd /c 'reg delete HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsStore /f >nul 2>&1'

        # stop store running
        $stop = 'WinStore.App', 'backgroundTaskHost', 'StoreDesktopExtension'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2

        # reset microsoft store
        Start-Process 'wsreset.exe' -WindowStyle Hidden

        # stop store running
        $stop = 'WinStore.App', 'backgroundTaskHost', 'StoreDesktopExtension'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2

        # open store settings
        Start-Process 'ms-windows-store:settings'

        & $WriteLog '[store] default complete'
    }

    default {
        & $WriteLog "[store] unknown mode: $mode"
    }
}
