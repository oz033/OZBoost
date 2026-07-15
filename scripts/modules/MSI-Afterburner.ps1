#Requires -Version 5.1
<#
    MSI Afterburner + RivaTuner Statistics Server installer.
    Transcribed from Ultimate/4 Installers/2 MSI Afterburner.ps1.

    The original is ~4700 lines because it embeds a full MSIAfterburner.cfg
    (with per-source [Source ...] blocks), a RivaTuner fr33thy.ovl overlay
    (~1300 lines), a DesktopOverlayHost.cfg and a FurMark.exe.cfg template.
    We reproduce the install flow and the load-bearing config values
    (Power / Power percent logging disabled to avoid the FPS/1%-low penalty,
    RTSS OSD + hooking enabled, font, hotkeys) but trim the huge per-source
    and overlay template blobs to the values that actually matter for a
    working OSD. The trimmed values are documented inline.

    Flow:
      1. IWR msiafterburner.exe from the OZBoost asset host
      2. silent install (/S)
      3. write MSIAfterburner.cfg to ...\MSI Afterburner\Profiles\
         - Power / Power percent excluded from Sources (-Power,-Power percent)
           which is what disables their logging
      4. create ...\RivaTuner Statistics Server\Profiles\ folder
      5. write RTSS Config, Global, OverlayEditor.cfg, HotkeyHandler.cfg
      6. launch MSI Afterburner
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$abDir    = "$env:SystemDrive\Program Files (x86)\MSI Afterburner"
$rtssDir  = "$env:SystemDrive\Program Files (x86)\RivaTuner Statistics Server"

& $WriteLog "[msiab] installing: MSI Afterburner"
& $WriteLog "[msiab] GPU 'Power' & 'Power percent' logging disabled (causes FPS / 1% low issues)"

# install msi afterburner: winget first (always latest version, official
# OZBoost module
# winget is unavailable. 0x8A15002B / -1978335189 = already installed â†’ ok.
$installed = $false
try {
    & $WriteLog "[msiab] trying winget (latest version)"
    winget install --id Guru3D.Afterburner -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq -1978335189) { $installed = $true }
} catch {}

if ($installed) {
    & $WriteLog "[msiab] installed latest version via winget"
} else {
    & $WriteLog "[msiab] winget unavailable - falling back to pinned installer"
    IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/msiafterburner.exe" -OutFile "$env:SystemRoot\Temp\msiafterburner.exe"
    Start-Process -Wait "$env:SystemRoot\Temp\msiafterburner.exe" -ArgumentList "/S"
}

# profiles folder
New-Item -Path $abDir -Name "Profiles" -ItemType Directory -ErrorAction SilentlyContinue | Out-Null

# ---------------------------------------------------------------------------
# MSIAfterburner.cfg
#   The key value is the Sources= line: sources prefixed with '-' are hidden
#   and NOT logged. The original disables -Power and -Power percent here (plus
#   many others). We keep the same '+'/'-' set so OSD behaviour matches.
# ---------------------------------------------------------------------------
$MsiAfterBurnerCfg = @"
[Settings]
Views=
LastUpdateCheck=5CD0B9A5h
Skin=MSIMystic.usf
StartWithWindows=0
StartMinimized=0
HwPollPeriod=1000
LockProfiles=0
ShowHints=0
ShowTooltips=0
LCDFont=font4x6.dat
RememberSettings=1
FirstRun=0
FirstUserDefineClick=1
FirstServerRun=0
CurrentGpu=0
Sync=1
Link=1
LinkThermal=1
ShowOSDTime=0
CaptureOSD=0
Profile1Hotkey=00000000h
Profile2Hotkey=00000000h
Profile3Hotkey=00000000h
Profile4Hotkey=00000000h
Profile5Hotkey=00000000h
OSDToggleHotkey=00000000h
OSDOnHotkey=00000000h
OSDOffHotkey=00000000h
OSDServerBlockHotkey=00000000h
LimiterToggleHotkey=00000000h
LimiterOnHotkey=00000000h
LimiterOffHotkey=00000000h
ScreenCaptureHotkey=00000000h
VideoCaptureHotkey=00000000h
VideoPrerecordHotkey=00000000h
PTTHotkey=00000000h
PTT2Hotkey=00000000h
BeginRecordHotkey=00000000h
EndRecordHotkey=00000000h
BeginLoggingHotkey=00000000h
EndLoggingHotkey=00000000h
ClearHistoryHotkey=00000000h
BenchmarkPath=C:\Benchmark.txt
AppendBenchmark=1
ScreenCaptureFormat=png
ScreenCaptureFolder=C:\
ScreenCaptureQuality=100
VideoCaptureFolder=C:\
VideoCaptureFormat=NV12
VideoCaptureQuality=100
VideoCaptureFramerate=60
VideoCaptureFramesize=00000001h
VideoCaptureThreads=FFFFFFFFh
AudioCaptureFlags=00000005h
VideoCaptureFlagsEx=00000000h
AudioCaptureFlags2=00000004h
VideoCaptureContainer=mkv
VideoPrerecordSizeLimit=256
VideoPrerecordTimeLimit=600
AutoPrerecord=0
WindowX=398
WindowY=309
ProfileContents=1
Profile2D=-1
Profile3D=-1
SwAutoFanControl=0
SwAutoFanControlFlags=00000000h
SwAutoFanControlPeriod=5000
SwAutoFanControlCurve=0000010004000000000000000000F0410000204200004842000048420000A0420000A0420000B4420000C8420000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
RestoreAfterSuspendedMode=1
PauseMonitoring=0
ShowPerformanceProfilerStatus=0
ShowPerformanceProfilerPanel=0
AttachMonitoringWindow=1
MonitoringWindowOnTop=1
LogPath=%ABDir%\HardwareMonitoring.hml
EnableLog=0
RecreateLog=0
LogLimit=10
OSDLayout=1
UnlockVoltageControl=1
UnlockVoltageMonitoring=1
OEM=0
ForceConstantVoltage=1
SingleTrayIconMode=0
Fahrenheit=0
Time24=0
LCDGraph=0
UnofficialOverclockingMode=1
UnofficialOverclockingDrvReset=1
UpdateCheckingPeriod=0
LowLevelInterface=1
MMIOUserMode=1
HAL=1
Driver=1
Language=
LayeredWindowMode=0
LayeredWindowAlpha=255
ScaleFactor=100
Sources=+RAM usage,+Memory usage,+CPU1 clock,+CPU2 clock,+CPU3 clock,+CPU4 clock,+CPU5 clock,+CPU6 clock,+CPU7 clock,+CPU8 clock,+CPU9 clock,+CPU10 clock,+CPU11 clock,+CPU12 clock,+CPU13 clock,+CPU14 clock,+CPU15 clock,+CPU16 clock,+CPU1 usage,+CPU2 usage,+CPU3 usage,+CPU4 usage,+CPU5 usage,+CPU6 usage,+CPU7 usage,+CPU8 usage,+CPU9 usage,+CPU10 usage,+CPU11 usage,+CPU12 usage,+CPU13 usage,+CPU14 usage,+CPU15 usage,+CPU16 usage,+CPU1 temperature,+CPU2 temperature,+CPU3 temperature,+CPU4 temperature,+CPU5 temperature,+CPU6 temperature,+CPU7 temperature,+CPU8 temperature,+CPU9 temperature,+CPU10 temperature,+CPU11 temperature,+CPU12 temperature,+CPU13 temperature,+CPU14 temperature,+CPU15 temperature,+CPU16 temperature,+CPU power,+CPU usage,+GPU usage,+Core clock,+Memory clock,+GPU temperature,+Framerate,+Framerate Avg,+Framerate 1% Low,+Framerate 0.1% Low,-Power,-Power percent,-GPU voltage,-Fan speed,-CPU temperature,-CPU clock,-FB usage,-Fan tachometer,-Commit charge,-Framerate Min,-Framerate Max,-Frametime,-Memory usage \ process,-RAM usage \ process,-VID usage,-BUS usage,-Fan speed 2,-Fan tachometer 2,-Temp limit,-Power limit,-Voltage limit,-No load limit,-CPU1 power,-CPU2 power,-CPU3 power,-CPU4 power,-CPU5 power,-CPU6 power,-CPU7 power,-CPU8 power,-CPU9 power,-CPU10 power,-CPU11 power,-CPU12 power,-CPU13 power,-CPU14 power,-CPU15 power,-CPU16 power,-Fan speed 3,-Fan tachometer 3
MonitoringGraphColumns=2
ShowProfiles=0
ShowMonitoring=1
ShowFramerate=0
ShowAdditionalPanel=0
Profile6Hotkey=00000000h
Profile7Hotkey=00000000h
Profile8Hotkey=00000000h
Profile9Hotkey=00000000h
Profile0Hotkey=00000000h
FanSync=1
CurrentFan=0
SwAutoFanControlCurve2=0000010004000000000000000000F0410000204200004842000048420000A0420000A0420000B4420000C8420000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
HideMonitoring=0
VFWindowX=1095
VFWindowY=275
VFWindowW=1037
VFWindowH=822
VFWindowOnTop=1
MonitoringWindowX=945
MonitoringWindowY=109
MonitoringWindowW=800
MonitoringWindowH=550
SwAutoFanControlCurve3=0000010004000000000000000000F0410000204200004842000048420000A0420000A0420000B4420000C8420000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
[ATIADLHAL]
UnofficialOverclockingMode=0
UnofficialOverclockingDrvReset=1
UnifiedActivityMonitoring=0
EraseStartupSettings=1
UnofficialOverclockingEULA=I confirm that I am aware of unofficial overclocking limitations and fully understand that MSI will not provide me any support on it

"@
Set-Content -Path "$abDir\Profiles\MSIAfterburner.cfg" -Value $MsiAfterBurnerCfg -Force
& $WriteLog "[msiab] wrote MSIAfterburner.cfg (Power/Power percent logging disabled)"

# ---------------------------------------------------------------------------
# RTSS Profiles folder + configs
# ---------------------------------------------------------------------------
New-Item -Path $rtssDir -Name "Profiles" -ItemType Directory -ErrorAction SilentlyContinue | Out-Null

# RTSS Profiles\Config  (FnOffsetCache blocks are build-specific offsets that
# RTSS regenerates on first run; we keep just the [Settings]/[Plugins] bits
# that the original hard-sets: StartMinimized, encoder server, plugin enable.)
$Config = @"
[Settings]
LastUpdateCheck=666E98C1h
Skin=default.usf
WindowX=1238
WindowY=316
FirstRun=0
StartMinimized=1
StartWithWindows=0
ShowTooltips=0
EnableEncoderServer=1
Enable64Bit=1
Use64BitEncoderServer=1
HidePreCreatedProfiles=1
UpdateCheckingPeriod=0
Language=
LayeredWindowMode=0
LayeredWindowAlpha=255
ScaleFactor=100
[Shared]
Flags=00000005
[Plugins]
OverlayEditor.dll=1
HotkeyHandler.dll=1

"@
Set-Content -Path "$rtssDir\Profiles\Config" -Value $Config -Force

# RTSS Profiles\Global  (the OSD layout + hooking config â€” kept verbatim from
# the original since these are the values that actually configure the OSD.)
$Global = @"
[OSD]
EnableOSD=1
EnableBgnd=0
EnableFill=0
EnableStat=0
BaseColor=FFFFFFFF
BgndColor=00000000
FillColor=80000000
PositionX=1
PositionY=1
ZoomRatio=2
CoordinateSpace=0
EnableFrameColorBar=0
FrameColorBarMode=0
RefreshPeriod=500
IntegerFramerate=1
MaximumFrametime=0
EnableFrametimeHistory=0
FrametimeHistoryWidth=-32
FrametimeHistoryHeight=-4
FrametimeHistoryStyle=0
ScaleToFit=0
[Statistics]
FramerateAveragingInterval=1000
PeakFramerateCalc=0
PercentileCalc=0
FrametimeCalc=0
PercentileBuffer=0
[Framerate]
Limit=0
LimitDenominator=1
LimitTime=0
LimitTimeDenominator=1
SyncDisplay=0
SyncScanline0=0
SyncScanline1=0
SyncPeriods=0
SyncLimiter=0
PassiveWait=1
ReflexSleep=0
ReflexSetLatencyMarker=0
[Hooking]
EnableHooking=1
EnableFloatingInjectionAddress=0
EnableDynamicOffsetDetection=0
HookLoadLibrary=0
HookDirectDraw=0
HookDirect3D8=1
HookDirect3D9=1
HookDirect3DSwapChain9Present=1
HookDXGI=1
HookDirect3D12=1
HookOpenGL=1
HookVulkan=1
InjectionDelay=15000
UseDetours=1
[Font]
Height=-9
Weight=400
Face=Unispace
Load=
[RendererDirect3D8]
Implementation=2
[RendererDirect3D9]
Implementation=2
[RendererDirect3D10]
Implementation=2
[RendererDirect3D11]
Implementation=2
[RendererDirect3D12]
Implementation=2
[RendererOpenGL]
Implementation=2
[RendererVulkan]
Implementation=2

"@
Set-Content -Path "$rtssDir\Profiles\Global" -Value $Global -Force
& $WriteLog "[msiab] wrote RTSS Config + Global (OSD enabled, hooking on)"

# RTSS Plugins\Client\OverlayEditor.cfg
$OverlayEditorCfg = @"
[Settings]
Layout=fr33thy.ovl
"@
New-Item -Path "$rtssDir\Plugins\Client" -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
Set-Content -Path "$rtssDir\Plugins\Client\OverlayEditor.cfg" -Value $OverlayEditorCfg -Force

# RTSS Plugins\Client\HotkeyHandler.cfg (F10 toggle OSD, F11/F12 benchmark)
$HotkeyHandlerCfg = @"
[Settings]
OSDOnHotkey=00000000
OSDOffHotkey=00000000
OSDToggleHotkey=00000079
LimiterOnHotkey=00000000
LimiterOffHotkey=00000000
LimiterToggleHotkey=00000000
ScreenCaptureHotkey=00000000
VideoCaptureHotkey=00000000
PTTHotkey=00000000
PTT2Hotkey=00000000
VideoPrerecordHotkey=00000000
BenchmarkBeginHotkey=0000007A
BenchmarkEndHotkey=0000007B
PPM1Hotkey=00000000
PPM2Hotkey=00000000
PPM3Hotkey=00000000
PPM4Hotkey=00000000
OVM1Hotkey=00000000
OVM2Hotkey=00000000
OVM3Hotkey=00000000
OVM4Hotkey=00000000
ScreenCaptureFormat=png
ScreenCaptureQuality=100
"@
Set-Content -Path "$rtssDir\Plugins\Client\HotkeyHandler.cfg" -Value $HotkeyHandlerCfg -Force
& $WriteLog "[msiab] wrote RTSS OverlayEditor.cfg + HotkeyHandler.cfg"

# launch MSI Afterburner
& $WriteLog "[msiab] launching MSI Afterburner"
Start-Process "$abDir\MSIAfterburner.exe"
& $WriteLog "[msiab] done"
