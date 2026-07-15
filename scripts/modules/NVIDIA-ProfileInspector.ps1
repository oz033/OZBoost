#Requires -Version 5.1
<#
    NVIDIA Profile Inspector automation.
    Transcribed from Ultimate/5 Graphics/8 P0 State.ps1 (P0 state via registry)
    and Ultimate/8 Advanced/7 ReBar Force.ps1 (rBAR force on/off via inspector.exe).

    Modes (via $PayloadArgs.mode):
      rebar_on  -> import a .nip that forces rBAR Enable=1 (original menu opt 2)
      rebar_off -> import a .nip that forces rBAR Enable=0 (original menu opt 3)
      p0_on     -> set DisableDynamicPstate=1 via registry (original menu opt 1)
      p0_off    -> set DisableDynamicPstate=0 via registry (original menu opt 2)

    For the rebar modes the flow mirrors the original: download inspector.exe
    from the OZBoost asset host, write a .nip file with the base profile + the rBAR
    block, import it silently, then open the GUI.

    The .nip is built from a single standard-settings here-string with a
    placeholder for the mode-dependent rBAR block (on/off/none).
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$mode = $PayloadArgs.mode  # 'rebar_on' | 'rebar_off' | 'p0_on' | 'p0_off'

# Standard profile settings shared by every rebar .nip (identical to the
# original ForceOn/ForceOff/default templates). Built as a single-quoted
# here-string with a __REBAR__ placeholder so nothing expands accidentally.
$BaseNip = @'
<?xml version="1.0" encoding="utf-16"?>
<ArrayOfProfile>
  <Profile>
    <ProfileName>Base Profile</ProfileName>
    <Executables/>
    <Settings>
      <ProfileSetting>
        <SettingNameInfo>Frame Rate Limiter V3</SettingNameInfo>
        <SettingID>277041154</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>GSYNC - Application Mode</SettingNameInfo>
        <SettingID>294973784</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>GSYNC - Application State</SettingNameInfo>
        <SettingID>279476687</SettingID>
        <SettingValue>4</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>GSYNC - Global Feature</SettingNameInfo>
        <SettingID>278196567</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>GSYNC - Global Mode</SettingNameInfo>
        <SettingID>278196727</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>GSYNC - Indicator Overlay</SettingNameInfo>
        <SettingID>268604728</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Maximum Pre-Rendered Frames</SettingNameInfo>
        <SettingID>8102046</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Preferred Refresh Rate</SettingNameInfo>
        <SettingID>6600001</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Ultra Low Latency - CPL State</SettingNameInfo>
        <SettingID>390467</SettingID>
        <SettingValue>2</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Ultra Low Latency - Enabled</SettingNameInfo>
        <SettingID>277041152</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Vertical Sync</SettingNameInfo>
        <SettingID>11041231</SettingID>
        <SettingValue>138504007</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Vertical Sync - Smooth AFR Behavior</SettingNameInfo>
        <SettingID>270198627</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Vertical Sync - Tear Control</SettingNameInfo>
        <SettingID>5912412</SettingID>
        <SettingValue>2525368439</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Vulkan/OpenGL Present Method</SettingNameInfo>
        <SettingID>550932728</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Antialiasing - Gamma Correction</SettingNameInfo>
        <SettingID>276652957</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Antialiasing - Mode</SettingNameInfo>
        <SettingID>276757595</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Antialiasing - Setting</SettingNameInfo>
        <SettingID>282555346</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Anisotropic Filter - Optimization</SettingNameInfo>
        <SettingID>8703344</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Anisotropic Filter - Sample Optimization</SettingNameInfo>
        <SettingID>15151633</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Anisotropic Filtering - Mode</SettingNameInfo>
        <SettingID>282245910</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Anisotropic Filtering - Setting</SettingNameInfo>
        <SettingID>270426537</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Texture Filtering - Negative LOD Bias</SettingNameInfo>
        <SettingID>1686376</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Texture Filtering - Quality</SettingNameInfo>
        <SettingID>13510289</SettingID>
        <SettingValue>20</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Texture Filtering - Trilinear Optimization</SettingNameInfo>
        <SettingID>3066610</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>CUDA - Force P2 State</SettingNameInfo>
        <SettingID>1343646814</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>CUDA - Sysmem Fallback Policy</SettingNameInfo>
        <SettingID>283962569</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Power Management - Mode</SettingNameInfo>
        <SettingID>274197361</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
__REBAR__
      <ProfileSetting>
        <SettingNameInfo>Shader Cache - Cache Size</SettingNameInfo>
        <SettingID>11306135</SettingID>
        <SettingValue>4294967295</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Threaded Optimization</SettingNameInfo>
        <SettingID>549528094</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>OpenGL GDI Compatibility</SettingNameInfo>
        <SettingID>544392611</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
      <ProfileSetting>
        <SettingNameInfo>Preferred OpenGL GPU</SettingNameInfo>
        <SettingID>550564838</SettingID>
        <SettingValue>id,2.0:268410DE,00000100,GF - (400,2,161,24564) @ (0)</SettingValue>
        <ValueType>String</ValueType>
      </ProfileSetting>
    </Settings>
  </Profile>
</ArrayOfProfile>
'@

switch ($mode) {
    'rebar_on'  {
        & $WriteLog "[npi] NVIDIA Profile Inspector: forcing rBAR ON"

        # inspector.exe
        & $WriteLog "[npi] downloading inspector.exe"
        IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/inspector.exe" -OutFile "$env:SystemRoot\Temp\inspector.exe"

        # unblock drs files (same as original)
        $drs = "C:\ProgramData\NVIDIA Corporation\Drs"
        if (Test-Path $drs) { Get-ChildItem -Path $drs -Recurse | Unblock-File -ErrorAction SilentlyContinue }

        $rebarBlock = @'
      <ProfileSetting>
        <SettingNameInfo>rBAR - Enable</SettingNameInfo>
        <SettingID>983226</SettingID>
        <SettingValue>1</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
'@
        $nip = $BaseNip.Replace('__REBAR__', $rebarBlock)
        $nipPath = "$env:SystemRoot\Temp\rebar_on.nip"
        Set-Content -Path $nipPath -Value $nip -Force
        & $WriteLog "[npi] importing rebar_on.nip"
        Start-Process -Wait "$env:SystemRoot\Temp\inspector.exe" -ArgumentList "-silentImport -silent $nipPath"
        Start-Process "$env:SystemRoot\Temp\inspector.exe"
        & $WriteLog "[npi] rBAR ON applied, inspector opened"
    }
    'rebar_off' {
        & $WriteLog "[npi] NVIDIA Profile Inspector: forcing rBAR OFF"

        & $WriteLog "[npi] downloading inspector.exe"
        IWR "https://github.com/FR33THYFR33THY/Ultimate-Files/raw/refs/heads/main/inspector.exe" -OutFile "$env:SystemRoot\Temp\inspector.exe"

        $drs = "C:\ProgramData\NVIDIA Corporation\Drs"
        if (Test-Path $drs) { Get-ChildItem -Path $drs -Recurse | Unblock-File -ErrorAction SilentlyContinue }

        $rebarBlock = @'
      <ProfileSetting>
        <SettingNameInfo>rBAR - Enable</SettingNameInfo>
        <SettingID>983226</SettingID>
        <SettingValue>0</SettingValue>
        <ValueType>Dword</ValueType>
      </ProfileSetting>
'@
        $nip = $BaseNip.Replace('__REBAR__', $rebarBlock)
        $nipPath = "$env:SystemRoot\Temp\rebar_off.nip"
        Set-Content -Path $nipPath -Value $nip -Force
        & $WriteLog "[npi] importing rebar_off.nip"
        Start-Process -Wait "$env:SystemRoot\Temp\inspector.exe" -ArgumentList "-silentImport -silent $nipPath"
        Start-Process "$env:SystemRoot\Temp\inspector.exe"
        & $WriteLog "[npi] rBAR OFF applied, inspector opened"
    }
    'p0_on'  {
        # Highest performance power state: DisableDynamicPstate=1 on every GPU
        # driver class subkey (faithful to P0 State.ps1 option 1).
        & $WriteLog "[npi] P0 State: ON (DisableDynamicPstate=1)"
        $subkeys = (Get-ChildItem -Path "Registry::HKLM\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -Force -ErrorAction SilentlyContinue).Name
        foreach ($key in $subkeys) {
            if ($key -notlike '*Configuration') {
                reg add "$key" /v "DisableDynamicPstate" /t REG_DWORD /d "1" /f | Out-Null
                & $WriteLog "[npi] DisableDynamicPstate=1 -> $key"
            }
        }
        & $WriteLog "[npi] P0 State ON applied"
    }
    'p0_off' {
        & $WriteLog "[npi] P0 State: OFF (DisableDynamicPstate=0)"
        $subkeys = (Get-ChildItem -Path "Registry::HKLM\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -Force -ErrorAction SilentlyContinue).Name
        foreach ($key in $subkeys) {
            if ($key -notlike '*Configuration') {
                reg add "$key" /v "DisableDynamicPstate" /t REG_DWORD /d "0" /f | Out-Null
                & $WriteLog "[npi] DisableDynamicPstate=0 -> $key"
            }
        }
        & $WriteLog "[npi] P0 State OFF applied"
    }
    default {
        & $WriteLog "[npi] unknown mode '$mode' (expected rebar_on/rebar_off/p0_on/p0_off)"
    }
}
