#Requires -Version 5.1
<#
    Custom Resolution Utility (CRU) + Scaled Resolution Editor (SRE).
    Transcribed from Ultimate/4 Installers/5 CRU SRE.ps1.

    Flow (per selected tool):
      1. IWR cru.zip / sre.zip from the OZBoost asset host
      2. Expand-Archive into C:\Program Files (x86)\CRUSRE
         (the original extracts CRU and SRE into the same CRUSRE folder so
          CRU.exe and SRE.exe live side-by-side)
      3. create Desktop + Start Menu shortcuts

    Optional payload: $PayloadArgs.items = @('cru','sre') to install a subset.
    Omitted/empty -> install both.
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$dest = "$env:SystemDrive\Program Files (x86)\CRUSRE"

# Allow caller to scope to a subset ('cru', 'sre').
$wanted = @($PayloadArgs.items)
if (-not $wanted -or $wanted.Count -eq 0) { $wanted = @('cru', 'sre') }

& $WriteLog "[crusre] installing: $($wanted -join ' + ')"

$Desktop = (New-Object -ComObject Shell.Application).Namespace('shell:Desktop').Self.Path
$StartMenu = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs"

# shortcut helper
function New-Lnk([string]$name, [string]$exe) {
    $wsh = New-Object -ComObject WScript.Shell
    $lnk = $wsh.CreateShortcut("$Desktop\$name.lnk")
    $lnk.TargetPath = "$dest\$exe"
    $lnk.WorkingDirectory = $dest
    $lnk.Save()

    $wsh = New-Object -ComObject WScript.Shell
    $lnk = $wsh.CreateShortcut("$StartMenu\$name.lnk")
    $lnk.TargetPath = "$dest\$exe"
    $lnk.WorkingDirectory = $dest
    $lnk.Save()
    & $WriteLog "[crusre] shortcuts created: $name"
}

if ($wanted -contains 'cru') {
    & $WriteLog "[crusre] downloading CRU"
    IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/cru.zip" -OutFile "$env:SystemRoot\Temp\cru.zip"
    Expand-Archive -Path "$env:SystemRoot\Temp\cru.zip" -DestinationPath $dest -Force
    & $WriteLog "[crusre] extracted CRU -> $dest"
    New-Lnk "Custom Resolution Utility" "CRU.exe"
}

if ($wanted -contains 'sre') {
    & $WriteLog "[crusre] downloading SRE"
    IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/sre.zip" -OutFile "$env:SystemRoot\Temp\sre.zip"
    Expand-Archive -Path "$env:SystemRoot\Temp\sre.zip" -DestinationPath $dest -Force
    & $WriteLog "[crusre] extracted SRE -> $dest"
    New-Lnk "Scaled Resolution Editor" "SRE.exe"
}

& $WriteLog "[crusre] done"
