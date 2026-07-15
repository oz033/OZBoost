#Requires -Version 5.1
<#
    Gamebar / Xbox toggle.
    Transcribed from Ultimate/6 Windows/21 Gamebar.ps1.

    For 'off': imports a .reg file that disables GameDVR / GameBar, points
    the ms-gamebar / ms-gamebarservices / ms-gamingoverlay URL-protocol
    handlers at systray.exe, removes the *Gaming* / *Xbox* AppX packages,
    stops GameInputSvc, and uninstalls the Microsoft GameInput MSI.

    For 'on': imports a .reg file that restores the defaults (re-enables
    ActivationType, restores the URL-protocol handlers by deleting the
    systray stubs, sets the Xbox services back to manual start), re-
    registers the AppX packages, and runs the edgewebview + gaming
    repair tool installers downloaded from the OZBoost asset host.

    mode:
      off -> original menu option 1
      on  -> original menu option 2
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$mode = $PayloadArgs.mode  # 'off' | 'on'

# Helper: uninstall an MSI by DisplayName glob (same pattern used in the
# original Gamebar.ps1 for Microsoft GameInput, and shared with Bloatware.ps1).
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

switch ($mode) {

    'off' {

        & $WriteLog '[gamebar] off: write + import disable reg file'

        # create reg file
        $GameBarOff = @"
Windows Registry Editor Version 5.00

; disable game bar
[HKEY_CURRENT_USER\System\GameConfigStore]
"GameDVR_Enabled"=dword:00000000

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\GameDVR]
"AppCaptureEnabled"=dword:00000000

; disable enable open xbox game bar using game controller
[HKEY_CURRENT_USER\Software\Microsoft\GameBar]
"UseNexusForGameBarEnabled"=dword:00000000

; disable use view + menu as guide button in apps
[HKEY_CURRENT_USER\Software\Microsoft\GameBar]
"GamepadNexusChordEnabled"=dword:00000000

; disable ms-gamebar notifications with xbox controller plugged in
[HKEY_CLASSES_ROOT\ms-gamebar]
"(Default)"="URL:ms-gamebar"
"URL Protocol"=""
"NoOpenWith"=""

[HKEY_CLASSES_ROOT\ms-gamebar\shell\open\command]
"(Default)"="%SystemRoot%\\System32\\systray.exe"

[HKEY_CLASSES_ROOT\ms-gamebarservices]
"(Default)"="URL:ms-gamebarservices"
"URL Protocol"=""
"NoOpenWith"=""

[HKEY_CLASSES_ROOT\ms-gamebarservices\shell\open\command]
"(Default)"="%SystemRoot%\\System32\\systray.exe"

[HKEY_CLASSES_ROOT\ms-gamingoverlay]
"(Default)"="URL:ms-gamingoverlay"
"URL Protocol"=""
"NoOpenWith"=""

[HKEY_CLASSES_ROOT\ms-gamingoverlay\shell\open\command]
"(Default)"="%SystemRoot%\\System32\\systray.exe"

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsRuntime\ActivatableClassId\Windows.Gaming.GameBar.PresenceServer.Internal.PresenceWriter]
"ActivationType"=dword:00000000
"@
        Set-Content -Path "$env:SystemRoot\Temp\gamebaroff.reg" -Value $GameBarOff -Force

        # import reg file
        Start-Process -Wait 'regedit.exe' -ArgumentList "/S `"$env:SystemRoot\Temp\gamebaroff.reg`"" -WindowStyle Hidden

        # stop gamebar running
        Stop-Process -Force -Name GameBar -ErrorAction SilentlyContinue | Out-Null

        # uninstall gamebar & xbox apps
        & $WriteLog '[gamebar] off: remove Gaming/Xbox AppX packages'
        Get-AppXPackage -AllUsers | Where-Object {
            $_.Name -like '*Gaming*' -or
            $_.Name -like '*Xbox*'
        } | Remove-AppxPackage -ErrorAction SilentlyContinue

        # stop microsoft gameinput running
        & cmd /c 'sc stop "GameInputSvc" >nul 2>&1'
        $stop = 'gamingservices', 'gamingservicesnet', 'GameInputRedistService'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2

        # uninstall microsoft gameinput
        & $WriteLog '[gamebar] off: uninstall Microsoft GameInput MSI'
        Uninstall-MsiByName 'Microsoft GameInput'

        # stop microsoft gameinput running again
        & cmd /c 'sc stop "GameInputSvc" >nul 2>&1'
        $stop = 'gamingservices', 'gamingservicesnet', 'GameInputRedistService'
        $stop | ForEach-Object { Stop-Process -Name $_ -Force -ErrorAction SilentlyContinue }

        & $WriteLog '[gamebar] off complete'
    }

    'on' {

        & $WriteLog '[gamebar] on: write + import restore reg file'

        # create reg file
        $GameBarOn = @"
Windows Registry Editor Version 5.00

; game bar
[HKEY_CURRENT_USER\System\GameConfigStore]
"GameDVR_Enabled"=dword:00000000

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\GameDVR]
"AppCaptureEnabled"=-

; enable open xbox game bar using game controller
[HKEY_CURRENT_USER\Software\Microsoft\GameBar]
"UseNexusForGameBarEnabled"=-

; enable use view + menu as guide button in apps
[HKEY_CURRENT_USER\Software\Microsoft\GameBar]
"GamepadNexusChordEnabled"=-

; ms-gamebar notifications with xbox controller plugged in regedit
[-HKEY_CLASSES_ROOT\ms-gamebar]

[HKEY_CLASSES_ROOT\ms-gamebar]
"URL Protocol"=""
@="URL:ms-gamebar"

[-HKEY_CLASSES_ROOT\ms-gamebar\shell\open\command]

[-HKEY_CLASSES_ROOT\ms-gamebarservices]

[-HKEY_CLASSES_ROOT\ms-gamebarservices\shell\open\command]

[-HKEY_CLASSES_ROOT\ms-gamingoverlay]

[HKEY_CLASSES_ROOT\ms-gamingoverlay]
"URL Protocol"=""
@="URL:ms-gamingoverlay"

[-HKEY_CLASSES_ROOT\ms-gamingoverlay\shell\open\command]

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsRuntime\ActivatableClassId\Windows.Gaming.GameBar.PresenceServer.Internal.PresenceWriter]
"ActivationType"=dword:00000001

; gameinput service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\GameInputSvc]
"Start"=dword:00000003

; gamedvr and broadcast user service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\BcastDVRUserService]
"Start"=dword:00000003

; xbox accessory management service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\XboxGipSvc]
"Start"=dword:00000003

; xbox live auth manager service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\XblAuthManager]
"Start"=dword:00000003

; xbox live game save service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\XblGameSave]
"Start"=dword:00000003

; xbox live networking service
[HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\XboxNetApiSvc]
"Start"=dword:00000003
"@
        Set-Content -Path "$env:SystemRoot\Temp\gamebaron.reg" -Value $GameBarOn -Force

        # import reg file
        Start-Process -Wait 'regedit.exe' -ArgumentList "/S `"$env:SystemRoot\Temp\gamebaron.reg`"" -WindowStyle Hidden

        # install store, gamebar & xbox apps
        & $WriteLog '[gamebar] on: re-register Store/Gaming/Xbox AppX packages'
        Get-AppXPackage -AllUsers | Where-Object {
            $_.Name -like '*Gaming*' -or
            $_.Name -like '*Xbox*' -or
            $_.Name -like '*Store*'
        } | ForEach-Object {
            Add-AppxPackage -DisableDevelopmentMode -Register -ErrorAction SilentlyContinue "$($_.InstallLocation)\AppXManifest.xml"
        }

        # download edge webview installer
        & $WriteLog '[gamebar] on: download + run edgewebview installer'
        Invoke-WebRequest 'https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/edgewebview.exe' -OutFile "$env:SystemRoot\Temp\edgewebview.exe"

        # start edge webview installer
        Start-Process -Wait "$env:SystemRoot\Temp\edgewebview.exe"

        # download gamebar repair tool
        & $WriteLog '[gamebar] on: download + run gaming repair tool'
        Invoke-WebRequest 'https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/gamingrepairtool.exe' -OutFile "$env:SystemRoot\Temp\gamingrepairtool.exe"

        # start gamebar repair tool
        Start-Process "$env:SystemRoot\Temp\gamingrepairtool.exe"

        & $WriteLog '[gamebar] on complete'
    }

    default {
        & $WriteLog "[gamebar] unknown mode: $mode"
    }
}
