#Requires -Version 5.1
param(
    [Parameter(Mandatory)] [string] $ResultFile,
    [string] $Target = '1.1.1.1',
    [int] $Count = 4
)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$safeTarget = ($Target -replace '[^\w\.\-:]', '').Substring(0, [Math]::Min(64, ($Target -replace '[^\w\.\-:]', '').Length))
if ([string]::IsNullOrWhiteSpace($safeTarget)) { $safeTarget = '1.1.1.1' }
if ($Count -lt 1) { $Count = 1 }
if ($Count -gt 10) { $Count = 10 }

$result = [ordered]@{
    ok = $false
    target = $safeTarget
    count = $Count
    sent = 0
    received = 0
    lossPercent = 100
    minMs = $null
    maxMs = $null
    avgMs = $null
    error = $null
}

try {
    $pings = @(Test-Connection -ComputerName $safeTarget -Count $Count -ErrorAction Stop)
    $times = @($pings | ForEach-Object {
        if ($null -ne $_.Latency) { [int]$_.Latency }
        elseif ($null -ne $_.ResponseTime) { [int]$_.ResponseTime }
        else { $null }
    } | Where-Object { $null -ne $_ })

    $result.sent = $Count
    $result.received = $times.Count
    $result.lossPercent = if ($Count -gt 0) { [math]::Round((1 - $times.Count / $Count) * 100) } else { 100 }
    if ($times.Count -gt 0) {
        $result.minMs = ($times | Measure-Object -Minimum).Minimum
        $result.maxMs = ($times | Measure-Object -Maximum).Maximum
        $result.avgMs = [math]::Round(($times | Measure-Object -Average).Average)
        $result.ok = $true
    } else {
        $result.error = 'no replies'
    }
}
catch {
    $result.error = $_.Exception.Message
}

$dir = Split-Path -Parent $ResultFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
($result | ConvertTo-Json -Depth 4 -Compress) | Set-Content -Path $ResultFile -Encoding UTF8
