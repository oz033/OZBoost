#Requires -Version 5.1
<#
    OZBoost System Analyzer.

    Scans the system and returns a JSON snapshot of hardware + key gaming-relevant
    settings. Used by the renderer to compute a Performance Score (0-100) and to
    decide which optimizations are relevant.

    Invoked via the elevated-PS bridge (same pattern as runTweak.ps1), but this
    script only READS — it doesn't change anything.
#>

param(
    [Parameter(Mandatory)] [string] $ResultFile
)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference    = 'SilentlyContinue'

function Write-OzResult($obj) {
    try {
        $dir = Split-Path -Parent $ResultFile
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        $json = $obj | ConvertTo-Json -Depth 6
        $utf8 = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($ResultFile, $json, $utf8)
    } catch {
        try {
            $fallback = "{`"error`":`"write failed: $($_.Exception.Message -replace '"','')`"}"
            [System.IO.File]::WriteAllText($ResultFile, $fallback)
        } catch { }
    }
}

try {

function Read-Reg($hive, $path, $value) {
    try {
        $full = @{ HKLM = 'HKEY_LOCAL_MACHINE'; HKCU = 'HKEY_CURRENT_USER' }[$hive]
        $v = [Microsoft.Win32.Registry]::GetValue("$full\$path", $value, $null)
        if ($null -eq $v) { return $null }
        if ($v -is [byte[]]) { return ($v | ForEach-Object { $_.ToString('x2') }) -join '' }
        return "$v"
    } catch { return $null }
}

$result = [ordered]@{}

# ─── CPU ───
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$result.cpu = @{
    name        = $cpu.Name
    cores       = [int]$cpu.NumberOfCores
    threads     = [int]$cpu.NumberOfLogicalProcessors
    maxClockMhz = [int]$cpu.MaxClockSpeed
    vendor      = if ($cpu.Manufacturer -match 'Genuin') { 'Intel' } elseif ($cpu.Manufacturer -match 'Authen') { 'AMD' } else { $cpu.Manufacturer }
}

# ─── GPU ───
# Prefer discrete gaming GPU (NVIDIA/AMD RX) over CPU iGPU (AMD Radeon Graphics / Intel UHD).
# Win32_VideoController order is arbitrary — first entry is often the iGPU.
function Get-GpuPriority($g) {
    $n = [string]$g.name
    $v = [string]$g.vendor
    # Virtual / stub adapters
    if ($n -match 'Microsoft Basic|Remote Display|Remote Desktop|Virtual|Parsec|Citrix|VMware|Hyper-V|Indirect') {
        return -1000
    }
    $p = 0
    if ($v -eq 'NVIDIA') {
        $p = 300
        if ($n -match 'GeForce|RTX|GTX|Quadro|Tesla') { $p += 50 }
    }
    elseif ($v -eq 'AMD') {
        # Discrete: RX / Radeon Pro / XT series. Integrated: "AMD Radeon(TM) Graphics", Vega on APU.
        if ($n -match 'RX\s*\d|Radeon\s+RX|Radeon\s+Pro|XTX|\bXT\b|Arc') {
            $p = 280
        }
        elseif ($n -match 'Radeon\(TM\)\s*Graphics|Radeon\s+Graphics$|Graphics\s*$|Vega|Radeon\s+HD') {
            $p = 40  # typical CPU iGPU
        }
        else {
            $p = 180  # unknown AMD — still prefer over Intel iGPU
        }
    }
    elseif ($v -eq 'Intel') {
        if ($n -match 'Arc') { $p = 250 }
        else { $p = 30 }  # UHD / Iris iGPU
    }
    else {
        $p = 10
    }
    # Prefer more VRAM when scores are close (AdapterRAM is often wrong/capped — still a weak signal)
    if ($g.vramMB -gt 512 -and $g.vramMB -lt 100000) {
        $p += [math]::Min([int]($g.vramMB / 1024), 24)
    }
    return $p
}

$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object {
    $vendor = if ($_.AdapterCompatibility -match 'NVIDIA' -or $_.Name -match 'NVIDIA|GeForce|RTX|GTX') { 'NVIDIA' }
              elseif ($_.AdapterCompatibility -match 'AMD|Advanced Micro' -or $_.Name -match 'AMD|Radeon') { 'AMD' }
              elseif ($_.AdapterCompatibility -match 'Intel' -or $_.Name -match 'Intel') { 'Intel' }
              else { $_.AdapterCompatibility }
    $dd = $null
    $ageDays = $null
    $driverStatus = 'unknown'
    try {
        if ($_.DriverDate) {
            $dd = ([DateTime]$_.DriverDate).ToString('yyyy-MM-dd')
            $ageDays = [int]([math]::Floor(((Get-Date) - [DateTime]$_.DriverDate).TotalDays))
            if ($ageDays -le 90) { $driverStatus = 'ok' }
            elseif ($ageDays -le 180) { $driverStatus = 'aging' }
            else { $driverStatus = 'outdated' }
        }
    } catch { }
    # AdapterRAM is often signed/overflow garbage on modern cards — clamp nonsense
    $rawRam = 0L
    try {
        $rawRam = [int64]$_.AdapterRAM
        if ($rawRam -lt 0) { $rawRam = [int64]([uint32]$rawRam) }
    } catch { $rawRam = 0 }
    $vramMB = if ($rawRam -gt 0) { [math]::Round($rawRam / 1MB) } else { 0 }
    # Cap absurd values from broken WMI (e.g. 4GB reported as huge uint)
    if ($vramMB -gt 65536) { $vramMB = 0 }

    [pscustomobject]@{
        name = $_.Name
        vendor = $vendor
        vramMB = $vramMB
        driverVersion = $_.DriverVersion
        driverDate = $dd
        driverAgeDays = $ageDays
        driverStatus = $driverStatus
        priority = 0
    }
})

foreach ($g in $gpus) { $g.priority = Get-GpuPriority $g }
$primary = $gpus | Sort-Object -Property @{ Expression = 'priority'; Descending = $true }, @{ Expression = 'vramMB'; Descending = $true } | Select-Object -First 1
if (-not $primary -and $gpus.Count -gt 0) { $primary = $gpus[0] }

$result.gpu = @{
    adapters = @($gpus | ForEach-Object {
        @{
            name = $_.name
            vendor = $_.vendor
            vramMB = $_.vramMB
            driverVersion = $_.driverVersion
            driverDate = $_.driverDate
            driverAgeDays = $_.driverAgeDays
            driverStatus = $_.driverStatus
            priority = $_.priority
        }
    })
    primaryVendor = if ($primary) { $primary.vendor } else { 'Unknown' }
    primaryDriverStatus = if ($primary) { $primary.driverStatus } else { 'unknown' }
    primaryDriverAgeDays = if ($primary) { $primary.driverAgeDays } else { $null }
    primaryDriverDate = if ($primary) { $primary.driverDate } else { $null }
    primaryDriverVersion = if ($primary) { $primary.driverVersion } else { $null }
    primaryName = if ($primary) { $primary.name } else { $null }
}

# ─── RAM ───
$ram = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
$totalRamGB = [math]::Round($ram.Sum / 1GB, 1)
$os = Get-CimInstance Win32_OperatingSystem
$freeRamGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
$result.ram = @{ totalGB = $totalRamGB; freeGB = $freeRamGB; usedPercent = [math]::Round((1 - $freeRamGB / $totalRamGB) * 100) }

# ─── Storage ───
$disks = @(Get-CimInstance Win32_DiskDrive | ForEach-Object {
    $type = if ($_.MediaType -match 'SSD|Fixed') { 'SSD' } elseif ($_.MediaType -match 'HDD') { 'HDD' } else { 'Unknown' }
    # NVMe check via model name
    if ($_.Model -match 'NVMe|Samsung|WD Black|Crucial|Kingston|Seagate FireCuda') { $type = 'SSD' }
    @{ model = $_.Model; sizeGB = [math]::Round($_.Size / 1GB); type = $type }
})
# System drive free space + rough Temp size
$sysDrive = Get-PSDrive -Name C -ErrorAction SilentlyContinue
$freeGB = if ($sysDrive) { [math]::Round($sysDrive.Free / 1GB, 1) } else { $null }
$totalGB = if ($sysDrive) { [math]::Round(($sysDrive.Used + $sysDrive.Free) / 1GB, 1) } else { $null }
$usedPct = if ($sysDrive -and $totalGB -gt 0) { [math]::Round(($sysDrive.Used / ($sysDrive.Used + $sysDrive.Free)) * 100) } else { $null }

$tempMB = 0
try {
    $tempPaths = @(
        "$env:TEMP",
        "$env:SystemRoot\Temp",
        "$env:LOCALAPPDATA\Temp"
    ) | Select-Object -Unique
    foreach ($tp in $tempPaths) {
        if (Test-Path $tp) {
            $sum = (Get-ChildItem -LiteralPath $tp -Recurse -Force -ErrorAction SilentlyContinue |
                Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            if ($sum) { $tempMB += [math]::Round($sum / 1MB) }
        }
    }
} catch { $tempMB = 0 }

$cleanerWorth = $false
if ($tempMB -ge 1024) { $cleanerWorth = $true }
if ($freeGB -ne $null -and $freeGB -lt 25) { $cleanerWorth = $true }
if ($usedPct -ne $null -and $usedPct -ge 85) { $cleanerWorth = $true }

$result.storage = @{
    disks = $disks
    hasSSD = ($disks | Where-Object { $_.type -eq 'SSD' }).Count -gt 0
    systemDrive = 'C:'
    freeGB = $freeGB
    totalGB = $totalGB
    usedPercent = $usedPct
    tempMB = [int]$tempMB
    cleanerWorth = $cleanerWorth
}

# ─── Windows Version ───
$osInfo = Get-CimInstance Win32_OperatingSystem
$build = [int]($osInfo.BuildNumber)
$result.os = @{
    version    = $osInfo.Caption
    build      = $build
    isWin11    = ($build -ge 22000)
    isWin10    = ($build -ge 10240 -and $build -lt 22000)
    isNotebook = (Get-CimInstance Win32_Battery | Measure-Object).Count -gt 0
}

# ─── Gaming-relevante Settings ───
$settings = @{}

# Power Plan
$power = powercfg /getactivescheme
$settings.activePowerPlan = if ($power -match 'GUID: ([0-9a-f-]+)') { $matches[1] } else { $null }
$settings.isUltimatePlan  = ($power -match '99999999|e9a42b02')

# Core Isolation / VBS
$ci = Read-Reg 'HKLM' 'SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity' 'Enabled'
$settings.coreIsolationEnabled = ($ci -eq '1')

# Memory Compression
try { $mc = (Get-MMAgent).MemoryCompression } catch { $mc = $null }
$settings.memoryCompressionEnabled = ($mc -eq $true)

# Game Mode
$settings.gameModeEnabled = ((Read-Reg 'HKCU' 'Software\Microsoft\GameBar' 'AutoGameModeEnabled') -ne '0')

# HAGS
$settings.hagsEnabled = ((Read-Reg 'HKLM' 'SYSTEM\CurrentControlSet\Control\GraphicsDrivers' 'HwSchMode') -eq '2')

# MPO
$settings.mpoDisabled = ((Read-Reg 'HKLM' 'SOFTWARE\Microsoft\Windows\Dwm' 'OverlayTestMode') -eq '5')

# Game DVR
$settings.gameDvrDisabled = ((Read-Reg 'HKCU' 'System\GameConfigStore' 'GameDVR_Enabled') -eq '0')

# Pointer Precision (Mausbeschleunigung)
$ms = Read-Reg 'HKCU' 'Control Panel\Mouse' 'MouseSpeed'
$settings.pointerPrecisionOff = ($ms -eq '0')

# Spectre/Meltdown
$sm = Read-Reg 'HKLM' 'SYSTEM\ControlSet001\Control\Session Manager\Memory Management' 'FeatureSettingsOverride'
$settings.spectreMeltdownOff = ($sm -eq '3')

# Defender Real-Time
$dr = Read-Reg 'HKLM' 'SOFTWARE\Microsoft\Windows Defender\Real-Time Protection' 'DisableRealtimeMonitoring'
$settings.defenderRtOff = ($dr -eq '1')

# Telemetry
$tel = Read-Reg 'HKLM' 'SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection' 'AllowTelemetry'
$settings.telemetryMin = ($tel -eq '0')

# Xbox Services (Start-Type)
try {
    $xboxSvcs = @(Get-Service | Where-Object { $_.Name -match '^Xbox|^GamingServices|^GameInput|^BcastDVR' })
    $settings.xboxServicesActive = ($xboxSvcs | Where-Object { $_.StartType -eq 'Automatic' }).Count
} catch { $settings.xboxServicesActive = 0 }

# OneDrive
$settings.oneDriveRunning = ((Get-Process OneDrive -ErrorAction SilentlyContinue) -ne $null)

# Recall
$recall = Read-Reg 'HKLM' 'SOFTWARE\Policies\Microsoft\Windows\WindowsAI' 'DisableAIDataAnalysis'
$settings.recallDisabled = ($recall -eq '1')

# Widgets
$wid = Read-Reg 'HKLM' 'SOFTWARE\Policies\Microsoft\Dsh' 'AllowNewsAndInterests'
$settings.widgetsDisabled = ($wid -eq '0')

# Copilot
$cop = Read-Reg 'HKLM' 'SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' 'TurnOffWindowsCopilot'
$settings.copilotDisabled = ($cop -eq '1')

# Background Apps
$bg = Read-Reg 'HKLM' 'SOFTWARE\Policies\Microsoft\Windows\AppPrivacy' 'LetAppsRunInBackground'
$settings.backgroundAppsDisabled = ($bg -eq '2')

# Timer Resolution Service
$settings.timerResSvc = ((Get-Service 'STR' -ErrorAction SilentlyContinue) -ne $null)

$result.settings = $settings

# ─── Hintergrund-Last (Prozess-Anzahl) ───
$procs = Get-Process
$result.background = @{
    processCount   = $procs.Count
    topByCpu       = @($procs | Sort-Object CPU -Descending | Select-Object -First 5 | ForEach-Object { $_.Name })
    topByRamMB     = @($procs | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 | ForEach-Object { [math]::Round($_.WorkingSet64 / 1MB); $_.Name } | Where-Object { $_ -is [string] })
}

# ─── Autostart-Programme ───
try {
    $startup = Get-CimInstance Win32_StartupCommand | Select-Object Name, Location
    $result.startup = @{ count = $startup.Count; items = @($startup | ForEach-Object { $_.Name }) }
} catch { $result.startup = @{ count = 0; items = @() } }

# ─── Dienste (Laufend) ───
$runningSvcs = @(Get-Service | Where-Object { $_.Status -eq 'Running' })
$autoSvcs    = @(Get-Service | Where-Object { $_.StartType -eq 'Automatic' })
$result.services = @{ running = $runningSvcs.Count; automatic = $autoSvcs.Count }

    Write-OzResult $result
    exit 0
}
catch {
    Write-OzResult @{ error = $_.Exception.Message; stage = 'systemAnalysis' }
    exit 1
}
