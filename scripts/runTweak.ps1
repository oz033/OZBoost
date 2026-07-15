#Requires -Version 5.1
<#
    OZBoost generic tweak runner.

    Invoked elevated by electron/services/powerShell.js with three paths:
      -PayloadFile : JSON { tweakId, action, actions: [...] }
      -LogFile     : we append human-readable lines here (UI tails this)
      -DoneFile    : we write <OZB:DONE exitCode="N"/> on completion

    Action types (mirror src/data/tweaks.js):
      { type:'reg',     hive, path, value, regType, data }   # set value
      { type:'reg',     hive, path, value, action:'delete' } # delete value
      { type:'cmd',     command }                             # cmd /c
      { type:'service', name, start }                         # sc.exe config start=
      { type:'powercfg', plan, subgroup, setting, ac, dc }
      { type:'appx',    action:'remove'|'register', name }
      { type:'task',    action:'disable'|'enable', name }
      { type:'file',    action:'delete'|'write', target, content? }
      { type:'ps_module', module, args:{} }                   # custom PS logic
#>

param(
    [Parameter(Mandatory)] [string] $PayloadFile,
    [Parameter(Mandatory)] [string] $LogFile,
    [Parameter(Mandatory)] [string] $DoneFile
)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

function Write-Log {
    param([string] $Line)
    Add-Content -Path $LogFile -Value $Line -Encoding UTF8
}

function Finish {
    param([int] $Code)
    Add-Content -Path $DoneFile -Value "<OZB:DONE exitCode=`"$Code`"/>" -Encoding UTF8
    exit $Code
}

if (-not (Test-Path $PayloadFile)) {
    Write-Log "[error] payload not found: $PayloadFile"
    Finish 1
}

$payload = Get-Content -Raw -Path $PayloadFile | ConvertFrom-Json
$tweakId = $payload.tweakId
$action  = $payload.action
$actions = $payload.actions

Write-Log "[ozboost] tweak=$tweakId action=$action steps=$(@($actions).Count)"

# Hive map → reg.exe expects the full names.
$hiveMap = @{
    'HKLM' = 'HKEY_LOCAL_MACHINE'
    'HKCU' = 'HKEY_CURRENT_USER'
    'HKCR' = 'HKEY_CLASSES_ROOT'
    'HKU'  = 'HKEY_USERS'
}

# Helper for modules that need to open a browser/settings page. Modules run
# elevated and must NOT call Start-Process for URLs (the browser would launch
# in the admin session and be invisible to the user). Instead they call the
# Request-Open function which is exposed to dot-sourced modules via $WriteLog's
# scope. Implemented as a marker line the non-elevated tail picks up.
function Request-Open {
    param([Parameter(Mandatory)][string]$Target)
    Write-Log "[open] $Target"
    Write-Log "<OZB:OPEN>$Target</OZB:OPEN>"
}
# Expose Request-Open to dot-sourced modules.
$RequestOpen = ${function:Request-Open}

$failures = 0

foreach ($a in $actions) {

    switch ($a.type) {

        'reg' {
            $hiveFull = $hiveMap[$a.hive]
            if (-not $hiveFull) { Write-Log "[skip] unknown hive $($a.hive)"; break }
            $key = "$hiveFull\$($a.path)"

            if ($a.action -eq 'delete') {
                if ($a.value) {
                    Write-Log "[reg] delete value  $key -> $($a.value)"
                    & reg delete $key /v $a.value /f 2>$null | Out-Null
                } else {
                    Write-Log "[reg] delete key    $key"
                    & reg delete $key /f 2>$null | Out-Null
                }
            } else {
                Write-Log "[reg] set            $key -> $($a.value) = $($a.data) ($($a.regType))"
                # Ensure parent key exists.
                & reg add $key /f 2>$null | Out-Null
                # Call operator quotes args with spaces correctly (Start-Process
                # -ArgumentList joined them unquoted and broke keys like "...\Windows Feeds").
                & reg.exe add $key /v $a.value /t $a.regType /d "$($a.data)" /f 2>$null | Out-Null
                if ($LASTEXITCODE -ne 0) { $failures++; Write-Log "[warn] reg add exit=$LASTEXITCODE" }
            }
        }

        'cmd' {
            Write-Log "[cmd] $($a.command)"
            & cmd /c $a.command 2>&1 | ForEach-Object { Write-Log "       $_" }
            if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
                $failures++; Write-Log "[warn] cmd exit=$LASTEXITCODE"
            }
        }

        'service' {
            Write-Log "[svc] $($a.name) start=$($a.start)"
            & sc.exe config $a.name start= $a.start 2>&1 | ForEach-Object { Write-Log "       $_" }
        }

        'powercfg' {
            Write-Log "[cfg] plan=$($a.plan) $($a.subgroup)/$($a.setting) ac=$($a.ac) dc=$($a.dc)"
            if ($a.ac) { & powercfg /setacvalueindex $a.plan $a.subgroup $a.setting $a.ac 2>$null | Out-Null }
            if ($a.dc) { & powercfg /setdcvalueindex $a.plan $a.subgroup $a.setting $a.dc 2>$null | Out-Null }
            & powercfg /setactive $a.plan 2>$null | Out-Null
        }

        'appx' {
            if ($a.action -eq 'remove') {
                Write-Log "[appx] remove $($a.name)"
                Get-AppxPackage -AllUsers $a.name | Remove-AppxPackage -ErrorAction SilentlyContinue
            } elseif ($a.action -eq 'register') {
                Write-Log "[appx] register $($a.name)"
                Get-AppxPackage -AllUsers $a.name | ForEach-Object {
                    Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\AppXManifest.xml" -ErrorAction SilentlyContinue
                }
            }
        }

        'task' {
            if ($a.action -eq 'disable') {
                Write-Log "[task] disable $($a.name)"
                & schtasks /Change /TN $a.name /Disable 2>$null | Out-Null
            } elseif ($a.action -eq 'enable') {
                Write-Log "[task] enable $($a.name)"
                & schtasks /Change /TN $a.name /Enable 2>$null | Out-Null
            }
        }

        'file' {
            if ($a.action -eq 'delete') {
                Write-Log "[file] delete $($a.target)"
                Remove-Item -Path $a.target -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
            } elseif ($a.action -eq 'write') {
                Write-Log "[file] write $($a.target)"
                Set-Content -Path $a.target -Value $a.content -Force -Encoding UTF8
            }
        }

        'reg_file' {
            # Write an inline .reg file and import it via regedit /S.
            # Used for tweaks that need to delete whole keys or set binary/hex
            # values that are awkward to express in the `reg` action.
            Write-Log "[reg] import reg-file ($($a.content.Length) chars)"
            $regPath = Join-Path $env:Temp "ozboost_$([guid]::NewGuid().ToString('N')).reg"
            try {
                Set-Content -Path $regPath -Value $a.content -Force -Encoding Unicode
                Start-Process -Wait -WindowStyle Hidden -FilePath regedit.exe -ArgumentList @('/S', $regPath)
            } finally {
                Remove-Item $regPath -Force -ErrorAction SilentlyContinue
            }
        }

        'net_binding' {
            # Enable or disable NetAdapterBindings by ComponentID.
            # { type:'net_binding', action:'disable'|'enable', components:['ms_tcpip6', ...] }
            $verb = if ($a.action -eq 'disable') { 'Disable' } else { 'Enable' }
            foreach ($comp in $a.components) {
                Write-Log "[net] $verb binding $comp"
                & "$verb-NetAdapterBinding" -Name '*' -ComponentID $comp -ErrorAction SilentlyContinue | Out-Null
            }
        }

        'open' {
            # Open a URI, ms-settings: link, or executable.
            #
            # IMPORTANT: this runner executes ELEVATED. Starting a browser or
            # settings page from an elevated process launches it in the admin
            # integrity level, which is detached from the user's desktop
            # session (invisible or blocked). Instead of Start-Process we emit
            # a marker that the non-elevated Electron tail picks up and opens
            # via shell.openExternal / shell.openPath.
            Write-Log "[open] $($a.target)"
            Write-Log "<OZB:OPEN>$($a.target)</OZB:OPEN>"
        }

        'sc' {
            # sc.exe stop/delete/start — narrower than 'service' which only
            # sets start type. { type:'sc', action:'stop'|'delete', name }
            Write-Log "[sc] $($a.action) $($a.name)"
            & sc.exe $a.action $a.name 2>&1 | ForEach-Object { Write-Log "       $_" }
        }

        'msi' {
            # Uninstall an MSI by DisplayName lookup.
            # { type:'msi', action:'uninstall', name:'Microsoft GameInput' }
            if ($a.action -eq 'uninstall') {
                $found = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
                    Where-Object { $_.DisplayName -like "*$($a.name)*" }
                if ($found) {
                    $guid = $found.PSChildName
                    Write-Log "[msi] uninstall $guid ($($a.name))"
                    Start-Process 'msiexec.exe' -ArgumentList "/x $guid /qn /norestart" -Wait -NoNewWindow
                } else {
                    Write-Log "[msi] $($a.name) not found"
                }
            }
        }

        'ps_module' {
            # Two shapes:
            #   { module:'Timer-Resolution', args:{...} }  → loads scripts/modules/<name>.ps1
            #   { code:'<inline PS>' }                      → runs inline (for GPU iteration)
            try {
                if ($a.code) {
                    Write-Log "[ps] inline ($($a.code.Length) chars)"
                    & ([scriptblock]::Create($a.code)) | ForEach-Object { Write-Log "       $_" }
                } elseif ($a.module) {
                    Write-Log "[ps] module $($a.module)"
                    $modulePath = Join-Path (Join-Path $PSScriptRoot 'modules') "$($a.module).ps1"
                    if (Test-Path $modulePath) {
                        # Build a splatting hashtable for the module's
                        # param($PayloadArgs, $WriteLog) signature, and expose
                        # Request-Open so modules can request browser/settings
                        # opens that run in the non-elevated Electron process.
                        $modArgs = @{
                            PayloadArgs = $a.args
                            WriteLog    = ${function:Write-Log}
                            RequestOpen = $RequestOpen
                        }
                        & $modulePath @modArgs
                    } else {
                        Write-Log "[warn] ps module not found: $modulePath"
                    }
                }
            } catch {
                $failures++; Write-Log "[warn] ps module threw: $($_.Exception.Message)"
            }
        }

        default {
            Write-Log "[skip] unknown action type $($a.type)"
        }
    }
}

if ($failures -gt 0) {
    Write-Log "[done] completed with $failures failed step(s)"
    # Report failures upward instead of masking them with exit 0. Exit code 2
    # signals "ran, but some steps failed" (1 = runner itself failed to start).
    Finish 2
} else {
    Write-Log "[done] all steps ok"
    Finish 0
}
