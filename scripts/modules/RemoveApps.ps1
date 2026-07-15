#Requires -Version 5.1
<#
    OZBoost selective app removal.

    Receives a list of app packages via $PayloadArgs.apps ([{id, method, wingetId}])
    and removes each one via Appx (Remove-AppxPackage + Remove-ProvisionedAppxPackage)
    or winget. Logs progress via & $WriteLog.
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$apps = $PayloadArgs.apps
if (-not $apps) { & $WriteLog '[apps] no apps selected'; return }

$removed = 0
$failed  = 0
$missing = 0

foreach ($app in $apps) {
    $appId    = $app.id
    $name     = if ($app.name) { $app.name } else { $appId }
    $method   = if ($app.method) { $app.method } else { 'appx' }

    if ($method -eq 'winget' -and $app.wingetId) {
        & $WriteLog "[apps] winget uninstall: $name ($($app.wingetId))"
        try {
            & winget uninstall --id $app.wingetId --silent --accept-source-agreements 2>&1 |
                ForEach-Object { & $WriteLog "       $_" }
            $removed++
        } catch {
            $failed++
            & $WriteLog "[warn] winget failed: $name"
        }
        continue
    }

    # Appx removal for AllUsers + Provisioned (so it doesn't come back).
    & $WriteLog "[apps] remove: $name"
    $found = $false
    try {
        $pkg = Get-AppxPackage -AllUsers -Name "*$appId*" -ErrorAction SilentlyContinue
        if ($pkg) {
            $found = $true
            $pkg | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue
        }
        # Also remove from provisioned list so it doesn't reinstall for new users.
        $prov = Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -like "*$appId*" }
        if ($prov) {
            $found = $true
            $prov | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Out-Null
        }
    } catch {
        $failed++
        & $WriteLog "[warn] error removing $name : $($_.Exception.Message)"
        continue
    }

    if ($found) { $removed++ } else { $missing++ }
}

& $WriteLog "[done] removed=$removed missing=$missing failed=$failed"
