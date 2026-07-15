#Requires -Version 5.1
<#
    OZBoost System Cleaner.
    Modus 'scan': analysiert 10 Cache-Bereiche und gibt Anzahl + Größe zurück.
    Modus 'clean': löscht die ausgewählten Bereiche.

    Wird aufgerufen mit -Mode scan/clean -ResultFile <path> [-Areas "area1,area2"]
#>

param(
    [Parameter(Mandatory)] [string] $Mode,
    [Parameter(Mandatory)] [string] $ResultFile,
    [string] $Areas = 'all'
)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference    = 'SilentlyContinue'

# Ausgewählte Bereiche parsen.
$selected = if ($Areas -eq 'all') { @() } else { $Areas -split ',' | ForEach-Object { $_.Trim() } }
function IsSelected($name) { return ($Areas -eq 'all') -or ($selected -contains $name) }

# Hilfsfunktion: Verzeichnis scannen.
function Scan-Dir($path, $pattern = '*') {
    if (-not $path -or -not (Test-Path $path)) { return @{ fileCount = 0; sizeMB = 0 } }
    $files = @(Get-ChildItem -Path $path -Filter $pattern -Recurse -File -Force -ErrorAction SilentlyContinue)
    $bytes = ($files | Measure-Object -Property Length -Sum).Sum
    if (-not $bytes) { $bytes = 0 }
    return @{ fileCount = $files.Count; sizeMB = [math]::Round($bytes / 1MB, 1) }
}

# Hilfsfunktion: Verzeichnis löschen (Inhalt, nicht das Verzeichnis selbst).
function Clean-Dir($path, $pattern = '*') {
    if (-not $path -or -not (Test-Path $path)) { return @{ cleaned = 0; freedMB = 0 } }
    $files = @(Get-ChildItem -Path $path -Filter $pattern -Recurse -File -Force -ErrorAction SilentlyContinue)
    $freedBytes = 0
    $cleaned = 0
    foreach ($f in $files) {
        try {
            $freedBytes += $f.Length
            Remove-Item -Path $f.FullName -Force -Recurse -ErrorAction SilentlyContinue
            $cleaned++
        } catch {}
    }
    return @{ cleaned = $cleaned; freedMB = [math]::Round($freedBytes / 1MB, 1) }
}

# Cache-Bereich Definitionen — nur Pfade, keine UI-Daten.
# Die UI (SystemCleaner.jsx) mappt die IDs auf Emojis/Namen/Beschreibungen.
$areaDefs = [ordered]@{
    windowsTemp = @{ paths = @(
        [System.IO.Path]::GetTempPath()
        "$env:SystemRoot\Temp"
        "$env:LOCALAPPDATA\Temp"
    )}
    shaderCache = @{ paths = @(
        "$env:LOCALAPPDATA\D3DSCache"
        "$env:LOCALAPPDATA\NVIDIA\DXCache"
        "$env:LOCALAPPDATA\AMD\DxCache"
        "$env:LOCALAPPDATA\AMD\DxcCache"
    )}
    nvidiaCache = @{ paths = @(
        "$env:LOCALAPPDATA\NVIDIA\DXCache"
        "$env:LOCALAPPDATA\NVIDIA\GLCache"
        "$env:PROGRAMDATA\NVIDIA Corporation\Downloader"
    )}
    amdCache = @{ paths = @(
        "$env:LOCALAPPDATA\AMD\DxCache"
        "$env:LOCALAPPDATA\AMD\DxcCache"
        "$env:LOCALAPPDATA\AMD\GLCache"
    )}
    updateCache = @{ paths = @("$env:SystemRoot\SoftwareDistribution\Download") }
    deliveryOpt = @{ paths = @(
        "$env:SystemRoot\SoftwareDistribution\DeliveryOptimization"
        "$env:LOCALAPPDATA\Microsoft\Windows\DeliveryOptimization\Cache"
    )}
    browserCache = @{ paths = @(
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
        "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles"
        "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data\Default\Cache"
    )}
    crashDumps = @{ paths = @(
        "$env:LOCALAPPDATA\CrashDumps"
        "$env:SystemRoot\LiveKernelReports"
    )}
    miniDumps = @{ paths = @(
        "$env:SystemRoot\Minidump"
        "$env:SystemRoot\MEMORY.DMP"
    )}
    recycleBin = @{ paths = @('RECYCLE:') }
}

$result = @{
    mode = $Mode
    areas = New-Object System.Collections.ArrayList
    totalFiles = 0
    totalSizeMB = 0
}

foreach ($key in $areaDefs.Keys) {
    $area = $areaDefs[$key]
    $isSelected = IsSelected $key

    if ($key -eq 'recycleBin' -and $isSelected) {
        # Papierkorb: via Shell COM scannen.
        if ($Mode -eq 'scan') {
            try {
                $shell = New-Object -ComObject Shell.Application
                $recycleBin = $shell.NameSpace(0x0a)
                $items = @($recycleBin.Items())
                $size = 0
                foreach ($item in $items) { $size += $item.ExtendedProperty('Size') }
                $result.areas.Add( @{ id = $key; fileCount = $items.Count; sizeMB = [math]::Round($size / 1MB, 1) } ) | Out-Null
                $result.totalFiles += $items.Count
                $result.totalSizeMB += [math]::Round($size / 1MB, 1)
            } catch {
                $result.areas.Add( @{ id = $key; fileCount = 0; sizeMB = 0 } ) | Out-Null
            }
        } else {
            try { Clear-RecycleBin -Force -ErrorAction SilentlyContinue } catch {}
            $result.areas.Add( @{ id = $key; cleaned = 0; freedMB = 0 } ) | Out-Null
        }
        continue
    }

    if ($Mode -eq 'scan') {
        # SCAN: alle Pfade eines Bereichs zusammenzählen.
        $totalFiles = 0
        $totalSize = 0
        foreach ($p in $area.paths) {
            $scan = Scan-Dir $p
            $totalFiles += $scan.fileCount
            $totalSize += $scan.sizeMB
        }
        $result.areas.Add( @{ id = $key; fileCount = $totalFiles; sizeMB = [math]::Round($totalSize, 1) } ) | Out-Null
        $result.totalFiles += $totalFiles
        $result.totalSizeMB += [math]::Round($totalSize, 1)
    } elseif ($isSelected) {
        # CLEAN: nur ausgewählte Bereiche löschen.
        $totalCleaned = 0
        $totalFreed = 0
        foreach ($p in $area.paths) {
            $clean = Clean-Dir $p
            $totalCleaned += $clean.cleaned
            $totalFreed += $clean.freedMB
        }
        $result.areas.Add( @{ id = $key; cleaned = $totalCleaned; freedMB = [math]::Round($totalFreed, 1) } ) | Out-Null
    }
}

if ($Mode -eq 'clean') {
    $totalFreedAll = ($result.areas | ForEach-Object { $_.freedMB } | Measure-Object -Sum).Sum
    $result.totalFreedMB = [math]::Round($totalFreedAll, 1)
}

$json = $result | ConvertTo-Json -Depth 4
$writer = New-Object System.IO.StreamWriter($ResultFile, $false, (New-Object System.Text.UTF8Encoding($false)))
$writer.Write($json)
$writer.Close()
exit 0
