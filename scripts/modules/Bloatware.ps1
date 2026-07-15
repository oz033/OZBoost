#Requires -Version 5.1
<#
    Bloatware removal / re-install module.
    Transcribed from Ultimate/6 Windows/23 Bloatware.ps1.

    The original is an interactive 9-option menu. We expose the same
    operations through a single `action` parameter. The exact notlike
    / notlike feature filters are preserved verbatim because they
    protect critical system components (file explorer, defender,
    start menu, immersive control panel, network, .NET, search, etc).

    action:
      remove_all              -> original menu option 2
      install_store           -> original menu option 3
      install_uwp_all         -> original menu option 4
      install_uwp_features    -> original menu option 5 (open settings page)
      install_legacy_features -> original menu option 6 (open dialog)
      install_onedrive        -> original menu option 7
      install_rdp             -> original menu option 8
      install_snippingtool    -> original menu option 9
#>

param($PayloadArgs, $WriteLog, $RequestOpen)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$action = $PayloadArgs.action

# Helper: uninstall an MSI by DisplayName glob (mirrors the inline pattern
# used repeatedly in the original script for GameInput / Update Health Tools).
function Uninstall-MsiByName {
    param([string] $Name)
    $find = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
    $hit = Get-ItemProperty $find -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -like "*$Name*" }
    if ($hit) {
        $guid = $hit.PSChildName
        Start-Process 'msiexec.exe' -ArgumentList "/x $guid /qn /norestart" -Wait -NoNewWindow
    }
}

switch ($action) {

    'remove_all' {

        & $WriteLog '[bloat] removing UWP apps...'

        # NOTE: keep these notlike filters EXACT — they protect:
        #  - file explorer
        #  - windows server defender / taskbar / start menu / control panel
        #  - image / video / codec extensions needed by photos & shell
        Get-AppXPackage -AllUsers | Where-Object {
            # breaks file explorer
            $_.Name -notlike '*CBS*' -and
            $_.Name -notlike '*Microsoft.AV1VideoExtension*' -and
            $_.Name -notlike '*Microsoft.AVCEncoderVideoExtension*' -and
            $_.Name -notlike '*Microsoft.HEIFImageExtension*' -and
            $_.Name -notlike '*Microsoft.HEVCVideoExtension*' -and
            $_.Name -notlike '*Microsoft.MPEG2VideoExtension*' -and
            $_.Name -notlike '*Microsoft.Paint*' -and
            $_.Name -notlike '*Microsoft.RawImageExtension*' -and
            # breaks windows server defender
            $_.Name -notlike '*Microsoft.SecHealthUI*' -and
            $_.Name -notlike '*Microsoft.VP9VideoExtensions*' -and
            $_.Name -notlike '*Microsoft.WebMediaExtensions*' -and
            $_.Name -notlike '*Microsoft.WebpImageExtension*' -and
            $_.Name -notlike '*Microsoft.Windows.Photos*' -and
            # breaks windows server task bar
            $_.Name -notlike '*Microsoft.Windows.ShellExperienceHost*' -and
            # breaks windows server start menu
            $_.Name -notlike '*Microsoft.Windows.StartMenuExperienceHost*' -and
            $_.Name -notlike '*Microsoft.WindowsNotepad*' -and
            $_.Name -notlike '*NVIDIACorp.NVIDIAControlPanel*' -and
            # breaks windows server immersive control panel
            $_.Name -notlike '*windows.immersivecontrolpanel*'
        } | Remove-AppxPackage -ErrorAction SilentlyContinue

        & $WriteLog '[bloat] removing UWP features (capabilities)...'

        Get-WindowsCapability -Online | Where-Object {
            $_.Name -notlike '*Microsoft.Windows.Ethernet*' -and
            # windows 10
            $_.Name -notlike '*Microsoft.Windows.MSPaint*' -and
            # windows 10
            $_.Name -notlike '*Microsoft.Windows.Notepad*' -and
            $_.Name -notlike '*Microsoft.Windows.Notepad.System*' -and
            $_.Name -notlike '*Microsoft.Windows.Wifi*' -and
            $_.Name -notlike '*NetFX3*' -and
            # windows 11 breaks msi installers if removed
            $_.Name -notlike '*VBSCRIPT*' -and
            # breaks monitoring programs
            $_.Name -notlike '*WMIC*' -and
            # windows 10 breaks uwp snippingtool if removed
            $_.Name -notlike '*Windows.Client.ShellComponents*'
        } | ForEach-Object {
            try {
                Remove-WindowsCapability -Online -Name $_.Name | Out-Null
            } catch { }
        }

        & $WriteLog '[bloat] removing legacy features (optional features)...'

        Get-WindowsOptionalFeature -Online | Where-Object {
            $_.FeatureName -notlike '*DirectPlay*' -and
            $_.FeatureName -notlike '*LegacyComponents*' -and
            $_.FeatureName -notlike '*NetFx3*' -and
            # breaks windows server turn windows features on or off
            $_.FeatureName -notlike '*NetFx4*' -and
            $_.FeatureName -notlike '*NetFx4-AdvSrvs*' -and
            # breaks windows server turn windows features on or off
            $_.FeatureName -notlike '*NetFx4ServerFeatures*' -and
            # breaks search
            $_.FeatureName -notlike '*SearchEngine-Client-Package*' -and
            # breaks windows server desktop
            $_.FeatureName -notlike '*Server-Shell*' -and
            # breaks windows server defender
            $_.FeatureName -notlike '*Windows-Defender*' -and
            # breaks windows server internet
            $_.FeatureName -notlike '*Server-Drivers-General*' -and
            # breaks windows server internet
            $_.FeatureName -notlike '*ServerCore-Drivers-General*' -and
            # breaks windows server internet
            $_.FeatureName -notlike '*ServerCore-Drivers-General-WOW64*' -and
            # breaks windows server turn windows features on or off
            $_.FeatureName -notlike '*Server-Gui-Mgmt*' -and
            # breaks windows server nvidia app
            $_.FeatureName -notlike '*WirelessNetworking*'
        } | ForEach-Object {
            try {
                Disable-WindowsOptionalFeature -Online -FeatureName $_.FeatureName -NoRestart -WarningAction SilentlyContinue | Out-Null
            } catch { }
        }

        & $WriteLog '[bloat] removing legacy apps...'

        # uninstall brlapi (brltty)
        & cmd /c 'sc stop "brlapi" >nul 2>&1'
        & cmd /c 'sc delete "brlapi" >nul 2>&1'
        & cmd /c 'takeown /f "%SystemRoot%\brltty" /r /d y >nul 2>&1'
        & cmd /c 'icacls "%SystemRoot%\brltty" /grant *S-1-5-32-544:F /t >nul 2>&1'
        Remove-Item "$env:SystemRoot\brltty" -Recurse -Force -ErrorAction SilentlyContinue | Out-Null

        # uninstall microsoft gameinput (MSI)
        Uninstall-MsiByName 'Microsoft GameInput'

        # stop onedrive running
        Stop-Process -Force -Name OneDrive -ErrorAction SilentlyContinue | Out-Null

        # uninstall onedrive
        & cmd /c 'C:\Windows\System32\OneDriveSetup.exe -uninstall >nul 2>&1'
        # uninstall office 365 onedrive
        Get-ChildItem -Path 'C:\Program Files*\Microsoft OneDrive', "$env:LOCALAPPDATA\Microsoft\OneDrive" -Filter 'OneDriveSetup.exe' -Recurse -ErrorAction SilentlyContinue |
            ForEach-Object { Start-Process -Wait $_.FullName -ArgumentList '/uninstall /allusers' -WindowStyle Hidden -ErrorAction SilentlyContinue }
        # windows 10 uninstall onedrive
        & cmd /c 'C:\Windows\SysWOW64\OneDriveSetup.exe -uninstall >nul 2>&1'
        # windows 10 remove onedrive scheduled tasks
        Get-ScheduledTask | Where-Object { $_.Taskname -match 'OneDrive' } | Unregister-ScheduledTask -Confirm:$false

        # uninstall remote desktop connection
        try {
            Start-Process 'mstsc' -ArgumentList '/Uninstall' -ErrorAction SilentlyContinue
        } catch { }
        # silent window for remote desktop connection
        $processExists = Get-Process -Name mstsc -ErrorAction SilentlyContinue
        if ($processExists) {
            $running = $true
            $timeout = 0
            do {
                $mstscProcess = Get-Process -Name mstsc -ErrorAction SilentlyContinue
                if ($mstscProcess -and $mstscProcess.MainWindowHandle -ne 0) {
                    Stop-Process -Force -Name mstsc -ErrorAction SilentlyContinue | Out-Null
                    $running = $false
                }
                Start-Sleep -Milliseconds 100
                $timeout++
                if ($timeout -gt 100) {
                    Stop-Process -Name mstsc -Force -ErrorAction SilentlyContinue
                    $running = $false
                }
            } while ($running)
        }
        Start-Sleep -Seconds 1

        # windows 10 uninstall old snipping tool
        try {
            Start-Process 'C:\Windows\System32\SnippingTool.exe' -ArgumentList '/Uninstall' -ErrorAction SilentlyContinue
        } catch { }
        # silent window for uninstall old snipping tool
        $processExists = Get-Process -Name SnippingTool -ErrorAction SilentlyContinue
        if ($processExists) {
            $running = $true
            $timeout = 0
            do {
                $snipProcess = Get-Process -Name SnippingTool -ErrorAction SilentlyContinue
                if ($snipProcess -and $snipProcess.MainWindowHandle -ne 0) {
                    Stop-Process -Force -Name SnippingTool -ErrorAction SilentlyContinue | Out-Null
                    $running = $false
                }
                Start-Sleep -Milliseconds 100
                $timeout++
                if ($timeout -gt 100) {
                    Stop-Process -Name SnippingTool -Force -ErrorAction SilentlyContinue
                    $running = $false
                }
            } while ($running)
        }
        Start-Sleep -Seconds 1

        # windows 10 uninstall update for windows 10 for x64-based systems
        Uninstall-MsiByName 'Update for x64-based Windows Systems'

        # windows 10 uninstall microsoft update health tools
        Uninstall-MsiByName 'Microsoft Update Health Tools'
        & cmd /c 'reg delete "HKLM\SYSTEM\ControlSet001\Services\uhssvc" /f >nul 2>&1'
        Unregister-ScheduledTask -TaskName PLUGScheduler -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

        & $WriteLog '[bloat] remove_all complete'
    }

    'install_store' {

        & $WriteLog '[bloat] installing store...'

        Get-AppXPackage -AllUsers | Where-Object {
            $_.Name -like '*Store*'
        } | ForEach-Object {
            Add-AppxPackage -DisableDevelopmentMode -Register -ErrorAction SilentlyContinue "$($_.InstallLocation)\AppXManifest.xml"
        }

        Start-Sleep -Seconds 5

        & $WriteLog '[bloat] optimizing store settings...'

        # open store settings page so disable personalized experiences on ms account sticks
        try {
            Start-Process 'ms-windows-store:settings'
        } catch { }
        Start-Sleep -Seconds 5

        # stop store running
        $stop = 'WinStore.App', 'backgroundTaskHost', 'StoreDesktopExtension'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2

        # disable apps updates
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

        # load hive
        reg load 'HKLM\Settings' $settingsdat >$null 2>&1

        # import reg file
        if ($LASTEXITCODE -eq 0) {
            reg import $regfilewindowsstore >$null 2>&1

            # unload hive
            [gc]::Collect()
            Start-Sleep -Seconds 2
            reg unload 'HKLM\Settings' >$null 2>&1
        }
        Start-Sleep -Seconds 2

        # open store settings
        Start-Process 'ms-windows-store:settings'

        & $WriteLog '[bloat] install_store complete'
    }

    'install_uwp_all' {

        & $WriteLog '[bloat] installing all UWP apps...'

        Get-AppxPackage -AllUsers | ForEach-Object {
            Add-AppxPackage -DisableDevelopmentMode -Register -ErrorAction SilentlyContinue "$($_.InstallLocation)\AppXManifest.xml"
        } 2>$null

        & $WriteLog '[bloat] install_uwp_all complete'
    }

    'install_uwp_features' {

        & $WriteLog '[bloat] opening UWP optional features page'
        # The original just opens the page and prints a list. We open the page
        # and surface the default-install lists in the log so the user sees
        # the same reference information as in the original menu.
        & $RequestOpen 'ms-settings:optionalfeatures'

        & $WriteLog '[bloat] --- Default Windows Install List W11 ---'
        & $WriteLog '[bloat] - Extended Theme Content'
        & $WriteLog '[bloat] - Facial Recognition (Windows Hello)'
        & $WriteLog '[bloat] - Internet Explorer mode'
        & $WriteLog '[bloat] - Math Recognizer'
        & $WriteLog '[bloat] - Notepad (system)'
        & $WriteLog '[bloat] - OpenSSH Client'
        & $WriteLog '[bloat] - Print Management'
        & $WriteLog '[bloat] - Steps Recorder'
        & $WriteLog '[bloat] - WMIC'
        & $WriteLog '[bloat] - Windows Media Player Legacy (App)'
        & $WriteLog '[bloat] - Windows PowerShell ISE'
        & $WriteLog '[bloat] - WordPad'
        & $WriteLog '[bloat] --- Default Windows Install List W10 ---'
        & $WriteLog '[bloat] - Internet Explorer 11'
        & $WriteLog '[bloat] - Math Recognizer'
        & $WriteLog '[bloat] - Microsoft Quick Assist (App)'
        & $WriteLog '[bloat] - Notepad (system)'
        & $WriteLog '[bloat] - OpenSSH Client'
        & $WriteLog '[bloat] - Print Management Console'
        & $WriteLog '[bloat] - Steps Recorder'
        & $WriteLog '[bloat] - Windows Fax and Scan'
        & $WriteLog '[bloat] - Windows Hello Face'
        & $WriteLog '[bloat] - Windows Media Player Legacy (App)'
        & $WriteLog '[bloat] - Windows PowerShell Integrated Scripting Environment'
        & $WriteLog '[bloat] - WordPad'
    }

    'install_legacy_features' {

        & $WriteLog '[bloat] opening legacy optional features dialog'
        Start-Process 'C:\Windows\System32\OptionalFeatures.exe' -ErrorAction SilentlyContinue

        & $WriteLog '[bloat] --- Default Windows Install List W11 ---'
        & $WriteLog '[bloat] - .Net Framework 4.8 Advanced Services +'
        & $WriteLog '[bloat] - WCF Services +'
        & $WriteLog '[bloat] - TCP Port Sharing'
        & $WriteLog '[bloat] - Media Features +'
        & $WriteLog '[bloat] - Windows Media Player Legacy (App)'
        & $WriteLog '[bloat] - Microsoft Print to PDF'
        & $WriteLog '[bloat] - Print and Document Services +'
        & $WriteLog '[bloat] - Internet Printing Client'
        & $WriteLog '[bloat] - Remote Differential Compression API Support'
        & $WriteLog '[bloat] - SMB Direct'
        & $WriteLog '[bloat] - Windows PowerShell 2.0 +'
        & $WriteLog '[bloat] - Windows PowerShell 2.0 Engine'
        & $WriteLog '[bloat] - Work Folders Client'
        & $WriteLog '[bloat] --- Default Windows Install List W10 ---'
        & $WriteLog '[bloat] - .Net Framework 4.8 Advanced Services +'
        & $WriteLog '[bloat] - WCF Services +'
        & $WriteLog '[bloat] - TCP Port Sharing'
        & $WriteLog '[bloat] - Internet Explorer 11'
        & $WriteLog '[bloat] - Media Features +'
        & $WriteLog '[bloat] - Windows Media Player'
        & $WriteLog '[bloat] - Microsoft Print to PDF'
        & $WriteLog '[bloat] - Microsoft XPS Document Writer'
        & $WriteLog '[bloat] - Print and Document Services +'
        & $WriteLog '[bloat] - Internet Printing Client'
        & $WriteLog '[bloat] - Remote Differential Compression API Support'
        & $WriteLog '[bloat] - SMB 1.0/CIFS File Sharing Support +'
        & $WriteLog '[bloat] - SMB 1.0/CIFS Automatic Removal'
        & $WriteLog '[bloat] - SMB 1.0/CIFS Client'
        & $WriteLog '[bloat] - SMB Direct'
        & $WriteLog '[bloat] - Windows PowerShell 2.0 +'
        & $WriteLog '[bloat] - Windows PowerShell 2.0 Engine'
        & $WriteLog '[bloat] - Work Folders Client'
    }

    'install_onedrive' {

        & $WriteLog '[bloat] installing OneDrive...'

        # install onedrive w10
        & cmd /c 'C:\Windows\SysWOW64\OneDriveSetup.exe >nul 2>&1'
        # install onedrive w11
        & cmd /c 'C:\Windows\System32\OneDriveSetup.exe >nul 2>&1'

        & $WriteLog '[bloat] install_onedrive complete'
    }

    'install_rdp' {

        & $WriteLog '[bloat] installing Remote Desktop Connection...'

        # download remote desktop connection
        Invoke-WebRequest 'https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/remotedesktopconnection.exe' -OutFile "$env:SystemRoot\Temp\remotedesktopconnection.exe"

        # install remote desktop connection
        & cmd /c '%SystemRoot%\Temp\remotedesktopconnection.exe >nul 2>&1'

        & $WriteLog '[bloat] install_rdp complete'
    }

    'install_snippingtool' {

        & $WriteLog '[bloat] installing Snipping Tool (ignore installer error W11; on W10 restart + rerun if it fails)...'

        # download w10 snipping tool
        Invoke-WebRequest 'https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/snippingtool.exe' -OutFile "$env:SystemRoot\Temp\snippingtool.exe"

        # install w10 snipping tool
        & cmd /c '%SystemRoot%\Temp\snippingtool.exe >nul 2>&1'

        # install w11 snipping tool
        Get-AppXPackage -AllUsers *Microsoft.ScreenSketch* | ForEach-Object {
            Add-AppxPackage -DisableDevelopmentMode -Register -ErrorAction SilentlyContinue "$($_.InstallLocation)\AppXManifest.xml"
        }

        & $WriteLog '[bloat] install_snippingtool complete'
    }

    default {
        & $WriteLog "[bloat] unknown action: $action"
    }
}
