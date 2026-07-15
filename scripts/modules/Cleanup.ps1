#Requires -Version 5.1
<#
    Selective temp/leftover cleanup.
    Split out of the former inline cleanup_temp action so the UI can offer a
    per-target choice instead of blindly wiping everything.

    Payload: $PayloadArgs.items = subset of:
      usertemp    - %USERPROFILE%\AppData\Local\Temp\*
      systemtemp  - %SystemRoot%\Temp\*
      windowsold  - C:\Windows.old (removes the previous-Windows rollback!)
      inetpub     - C:\inetpub
      perflogs    - C:\PerfLogs
      dumpstack   - C:\DumpStack.log
      cleanmgr    - launch Windows Disk Cleanup afterwards
    Omitted/empty -> safe default (usertemp, systemtemp, inetpub, perflogs, dumpstack).
#>

param($PayloadArgs, $WriteLog, $RequestOpen)

$ErrorActionPreference = 'Continue'

$wanted = @($PayloadArgs.items)
if (-not $wanted -or $wanted.Count -eq 0) {
    $wanted = @('usertemp', 'systemtemp', 'inetpub', 'perflogs', 'dumpstack')
}

$targets = @{
    usertemp   = "$env:USERPROFILE\AppData\Local\Temp\*"
    systemtemp = "$env:SystemRoot\Temp\*"
    windowsold = "C:\Windows.old"
    inetpub    = "C:\inetpub"
    perflogs   = "C:\PerfLogs"
    dumpstack  = "C:\DumpStack.log"
}

foreach ($key in $wanted) {
    if ($key -eq 'cleanmgr') { continue }
    $path = $targets[$key]
    if (-not $path) { & $WriteLog "[cleanup] unknown target '$key' (skipped)"; continue }
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        & $WriteLog "[cleanup] cleaned: $path"
    } else {
        & $WriteLog "[cleanup] not present: $path"
    }
}

if ($wanted -contains 'cleanmgr') {
    & $WriteLog "[cleanup] launching Disk Cleanup"
    & $RequestOpen 'cleanmgr.exe'
}

& $WriteLog "[cleanup] done"
