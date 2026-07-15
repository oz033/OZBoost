#Requires -Version 5.1
<#
    OZBoost status reader.

    Reads the current system state for a list of registry values and returns
    a JSON map { "<hive>\<path>\<value>": "<currentData>" } so the main process
    can compare against a tweak's apply-actions to decide whether the tweak is
    already applied, partially applied, or not applied.

    Invoked elevated (HKLM reads need it) with one argument:
        -PayloadFile : JSON { actions: [ { type:'reg', hive, path, value } ] }

    Writes the result JSON to the ResultFile and exits. Non-reg actions are
    skipped (we can't reliably check service/appx state cheaply).
#>

param(
    [Parameter(Mandatory)] [string] $PayloadFile,
    [Parameter(Mandatory)] [string] $ResultFile
)

$ErrorActionPreference = 'Continue'

$hiveMap = @{
    'HKLM' = 'HKEY_LOCAL_MACHINE'
    'HKCU' = 'HKEY_CURRENT_USER'
    'HKCR' = 'HKEY_CLASSES_ROOT'
    'HKU'  = 'HKEY_USERS'
}

$payload = Get-Content -Raw -Path $PayloadFile | ConvertFrom-Json
$actions = $payload.actions

$result = [ordered]@{}

foreach ($a in $actions) {
    # Only static reg actions are readable; ps_module/cmd/service can't be cheaply introspected.
    if ($a.type -ne 'reg') { continue }
    $hiveFull = $hiveMap[$a.hive]
    if (-not $hiveFull) { continue }

    $key = "$hiveFull\$($a.path)"
    $valueName = $a.value
    # Empty value name means the (Default) value.
    if ($null -eq $valueName -or $valueName -eq '') { $valueName = '' }

    $lookupKey = "$($a.hive)\$($a.path)\$valueName"

    try {
        if ([Microsoft.Win32.Registry]::GetValue($key, $valueName, $null) -ne $null) {
            $current = [Microsoft.Win32.Registry]::GetValue($key, $valueName, $null)
            # Normalise common types to a string form for comparison.
            if ($current -is [byte[]]) {
                $current = ($current | ForEach-Object { $_.ToString('x2') }) -join ''
            } elseif ($current -is [int] -or $current -is [long]) {
                $current = $current.ToString()
            }
            $result[$lookupKey] = @{ present = $true; data = "$current" }
        } else {
            $result[$lookupKey] = @{ present = $false; data = '' }
        }
    } catch {
        $result[$lookupKey] = @{ present = $false; data = ''; error = $_.Exception.Message }
    }
}

# Write JSON WITHOUT BOM (PS 5.1 Set-Content adds BOM → JSON.parse crash).
$json = $result | ConvertTo-Json -Depth 4
$writer = New-Object System.IO.StreamWriter($ResultFile, $false, (New-Object System.Text.UTF8Encoding($false)))
$writer.Write($json)
$writer.Close()
exit 0
