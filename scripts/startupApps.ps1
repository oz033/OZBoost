#Requires -Version 5.1
<#
  OZBoost Startup Apps — list / disable / enable user Run-key startups.
  Only HKCU\...\Run (safe, no system services). Disabled entries stored
  under HKCU\Software\OZBoost\DisabledStartup for re-enable.
#>
param(
    [Parameter(Mandatory)] [string] $ResultFile,
    [ValidateSet('list', 'disable', 'enable')] [string] $Mode = 'list',
    [string] $EntryName = ''
)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$runPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$disabledPath = 'HKCU:\Software\OZBoost\DisabledStartup'

function Ensure-DisabledKey {
    if (-not (Test-Path $disabledPath)) {
        New-Item -Path $disabledPath -Force | Out-Null
    }
}

function Get-RunItems {
    $items = @()
    if (Test-Path $runPath) {
        $props = Get-ItemProperty -Path $runPath -ErrorAction SilentlyContinue
        if ($props) {
            $props.PSObject.Properties | Where-Object {
                $_.Name -notmatch '^PS' -and $_.Name -ne '(default)'
            } | ForEach-Object {
                $items += [ordered]@{
                    id       = "hkcu_run::$($_.Name)"
                    name     = [string]$_.Name
                    command  = [string]$_.Value
                    location = 'HKCU\Run'
                    enabled  = $true
                }
            }
        }
    }
    Ensure-DisabledKey
    if (Test-Path $disabledPath) {
        $d = Get-ItemProperty -Path $disabledPath -ErrorAction SilentlyContinue
        if ($d) {
            $d.PSObject.Properties | Where-Object {
                $_.Name -notmatch '^PS' -and $_.Name -ne '(default)'
            } | ForEach-Object {
                $items += [ordered]@{
                    id       = "hkcu_run::$($_.Name)"
                    name     = [string]$_.Name
                    command  = [string]$_.Value
                    location = 'HKCU\Run'
                    enabled  = $false
                }
            }
        }
    }
    return $items
}

$result = [ordered]@{ ok = $true; items = @(); error = $null }

try {
    if ($Mode -eq 'list') {
        $result.items = @(Get-RunItems)
    }
    elseif ($Mode -eq 'disable') {
        if ([string]::IsNullOrWhiteSpace($EntryName)) { throw 'EntryName required' }
        Ensure-DisabledKey
        $val = (Get-ItemProperty -Path $runPath -Name $EntryName -ErrorAction Stop).$EntryName
        Set-ItemProperty -Path $disabledPath -Name $EntryName -Value $val -Force
        Remove-ItemProperty -Path $runPath -Name $EntryName -Force -ErrorAction Stop
        $result.items = @(Get-RunItems)
        $result.action = 'disabled'
        $result.name = $EntryName
    }
    elseif ($Mode -eq 'enable') {
        if ([string]::IsNullOrWhiteSpace($EntryName)) { throw 'EntryName required' }
        Ensure-DisabledKey
        $val = (Get-ItemProperty -Path $disabledPath -Name $EntryName -ErrorAction Stop).$EntryName
        if (-not (Test-Path $runPath)) { New-Item -Path $runPath -Force | Out-Null }
        Set-ItemProperty -Path $runPath -Name $EntryName -Value $val -Force
        Remove-ItemProperty -Path $disabledPath -Name $EntryName -Force -ErrorAction Stop
        $result.items = @(Get-RunItems)
        $result.action = 'enabled'
        $result.name = $EntryName
    }
}
catch {
    $result.ok = $false
    $result.error = $_.Exception.Message
    $result.items = @(Get-RunItems)
}

$dir = Split-Path -Parent $ResultFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
($result | ConvertTo-Json -Depth 6 -Compress) | Set-Content -Path $ResultFile -Encoding UTF8
