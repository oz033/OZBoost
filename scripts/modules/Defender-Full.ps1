#Requires -Version 5.1
<#
    Windows Defender / Windows Security bulk disable/enable tweak.
    Transcribed from Ultimate/8 Advanced/1 Defender.ps1.

    The original script needed Safe Boot + a TrustedInstaller
    binPath-hijack to flip keys under HKLM\...\Windows Defender and the
    Defender service/driver Start values, because those keys are owned by
    WinDefend / TrustedInstaller and reject writes from a normal elevated
    process once Tamper Protection is ON.

    OZBoost's runner is already elevated. This module therefore drops the
    Safe-Boot + TrustedInstaller machinery and applies every registry value
    directly from an elevated context.

    IMPORTANT - Tamper Protection:
      If "Tamper Protection" is still ON in Windows Security, many of the
      HKLM\...\Windows Defender writes (DisableRealtimeMonitoring, service
      Start values, TamperProtection itself, ...) will be silently reverted
      or rejected. The user MUST turn Tamper Protection OFF manually first.
      This module logs a prominent warning and continues past per-key
      failures rather than aborting.

    modes:
      disable - turn off real-time protection, cloud submission, SmartScreen,
                VBS/memory integrity, LSA PPL, vulnerable driver blocklist,
                Defender services & drivers, etc.
      enable  - restore Windows defaults for all of the above.

    No automatic reboot is issued - a warning is logged instead. A reboot is
    required for service/driver Start changes and bcdedit changes to apply.
#>

param($PayloadArgs, $WriteLog)

$ErrorActionPreference = 'Continue'

$mode = $PayloadArgs.mode  # 'disable' | 'enable'

# ---------------------------------------------------------------------------
# Helper: run a single operation and log its output. Never throws - a failed
# op logs a [warn] line so the run continues (Tamper Protection commonly
# blocks individual keys and we don't want to abort the whole pass).
# ---------------------------------------------------------------------------
function Invoke-Op {
    param($Op)

    switch ($Op.op) {

        'regadd' {
            # Ensure parent key exists, then set the value.
            & reg add $Op.k /f 2>$null | Out-Null
            if ($Op.ve) {
                & $WriteLog "[reg] add (default)  $($Op.k) = $($Op.d) ($($Op.t))"
                & reg add $Op.k /ve /t $Op.t /d $Op.d /f 2>&1 | ForEach-Object { & $WriteLog "       $_" }
            } else {
                & $WriteLog "[reg] add            $($Op.k) -> $($Op.v) = $($Op.d) ($($Op.t))"
                & reg add $Op.k /v $Op.v /t $Op.t /d $Op.d /f 2>&1 | ForEach-Object { & $WriteLog "       $_" }
            }
        }

        'regdel' {
            if ($Op.v) {
                & $WriteLog "[reg] delete value   $($Op.k) -> $($Op.v)"
                & reg delete $Op.k /v $Op.v /f 2>&1 | ForEach-Object { & $WriteLog "       $_" }
            } else {
                & $WriteLog "[reg] delete key     $($Op.k)"
                & reg delete $Op.k /f 2>&1 | ForEach-Object { & $WriteLog "       $_" }
            }
        }

        'bcdel' {
            # bcdedit /deletevalue <name> - silently ignored if not present.
            & $WriteLog "[bcd] deletevalue $($Op.name)"
            & bcdedit /deletevalue $Op.name 2>&1 | ForEach-Object { & $WriteLog "       $_" }
        }

        'schtasks' {
            # action is 'disable' or 'enable'
            $flag = if ($Op.action -eq 'enable') { '/Enable' } else { '/Disable' }
            & $WriteLog "[task] $($Op.action) $($Op.tn)"
            & schtasks /Change /TN $Op.tn $flag 2>$null | Out-Null
        }

        default {
            & $WriteLog "[warn] unknown op: $($Op.op)"
        }
    }
}

# ---------------------------------------------------------------------------
# Build the operation list for the requested mode. Every entry below maps
# 1:1 to a line in the original script's $windowssecuritysettings array,
# the post-registry normal-boot steps, and the safe-boot payload steps.
# ---------------------------------------------------------------------------
if ($mode -eq 'disable') {

    & $WriteLog "[defender] mode=disable"
    & $WriteLog "[warn] Tamper Protection must be turned OFF manually in Windows Security"
    & $WriteLog "[warn] before running this, otherwise many keys will be rejected/reverted."

    $ops = @(
        # --- Virus & threat protection -> manage settings ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Real-Time Protection'; v='DisableRealtimeMonitoring'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Real-Time Protection'; v='DisableAsyncScanOnOpen';      t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Spynet'; v='SpyNetReporting';       t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Spynet'; v='SubmitSamplesConsent'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Features'; v='TamperProtection'; t='REG_DWORD'; d='4' },

        # --- Ransomware: controlled folder access off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Windows Defender Exploit Guard\Controlled Folder Access'; v='EnableControlledFolderAccess'; t='REG_DWORD'; d='0' },

        # --- Firewall & Defender notification settings ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Notifications'; v='DisableEnhancedNotifications'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='NoActionNotificationDisabled';    t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='SummaryNotificationDisabled';     t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='FilesBlockedNotificationDisabled'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableNotifications';            t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableDynamiclockNotifications';   t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableWindowsHelloNotifications'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Epoch'; v='Epoch'; t='REG_DWORD'; d='1231' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\DomainProfile';   v='DisableNotifications'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\PublicProfile';   v='DisableNotifications'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile'; v='DisableNotifications'; t='REG_DWORD'; d='1' },

        # --- Smart App Control off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='VerifiedAndReputableTrustModeEnabled'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='SmartLockerMode'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='PUAProtection'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\AppID\Configuration\SMARTLOCKER'; v='START_PENDING'; t='REG_DWORD';  d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\AppID\Configuration\SMARTLOCKER'; v='ENABLED';      t='REG_BINARY'; d='0000000000000000' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\CI\Policy'; v='VerifiedAndReputablePolicyState'; t='REG_DWORD'; d='0' },

        # --- Reputation-based protection / SmartScreen off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer'; v='SmartScreenEnabled'; t='REG_SZ'; d='Off' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Edge\SmartScreenEnabled';    ve=$true; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Edge\SmartScreenPuaEnabled'; ve=$true; t='REG_DWORD'; d='0' },

        # --- Phishing protection off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='CaptureThreatWindow'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyMalicious';     t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyPasswordReuse'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyUnsafeApp';     t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='ServiceEnabled';      t='REG_DWORD'; d='0' },

        # --- PUA protection off (second occurrence in original) ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='PUAProtection'; t='REG_DWORD'; d='0' },

        # --- SmartScreen for Store apps off ---
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\AppHost'; v='EnableWebContentEvaluation'; t='REG_DWORD'; d='0' },

        # --- Exploit protection: keep CFG on for anticheat ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\Session Manager\kernel'; v='MitigationOptions'; t='REG_BINARY'; d='222222000001000000000000000000000000000000000000' },

        # --- Core isolation / memory integrity off ---
        @{ op='regdel';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='ChangedInBootCycle' },
        @{ op='regadd';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='Enabled'; t='REG_DWORD'; d='0' },
        @{ op='regdel';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='WasEnabledBy' },

        # --- VBS / virtualization-based security off ---
        @{ op='bcdel'; name='allowedinmemorysettings' },
        @{ op='bcdel'; name='isolatedcontext' },
        @{ op='bcdel'; name='hypervisorlaunchtype' },
        @{ op='regdel'; k='HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard'; v='EnableVirtualizationBasedSecurity' },

        # --- Local Security Authority (LSA) protection off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa'; v='RunAsPPL'; t='REG_DWORD'; d='0' },

        # --- Microsoft vulnerable driver blocklist off ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\CI\Config'; v='VulnerableDriverBlocklistEnable'; t='REG_DWORD'; d='0' },

        # --- Defender services disabled (Start=4) ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdNisSvc';            v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WinDefend';           v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\MDCoreSvc';           v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\wscsvc';              v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\webthreatdefsvc';     v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\webthreatdefusersvc'; v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\Sense';               v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\SecurityHealthService'; v='Start'; t='REG_DWORD'; d='4' },

        # --- Defender drivers disabled (Start=4) ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdBoot';   v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdFilter'; v='Start'; t='REG_DWORD'; d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdNisDrv'; v='Start'; t='REG_DWORD'; d='4' }
    )

    # Run every registry / bcdedit op.
    foreach ($op in $ops) { Invoke-Op $op }

    # --- Stop SmartScreen and move it out of System32 (best-effort) ---
    & $WriteLog "[defender] stopping smartscreen process"
    Stop-Process -Force -Name smartscreen -ErrorAction SilentlyContinue | Out-Null
    if (Test-Path "$env:SystemRoot\System32\smartscreen.exe") {
        & $WriteLog "[defender] moving smartscreen.exe System32 -> Windows"
        & cmd /c move /y "$env:SystemRoot\System32\smartscreen.exe" "$env:SystemRoot\smartscreen.exe" 2>&1 | ForEach-Object { & $WriteLog "       $_" }
        if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
            & $WriteLog "[warn] smartscreen move failed (exit=$LASTEXITCODE) - file may be locked"
        }
    }

    # --- Disable the Windows-Defender-Default-Definitions feature ---
    & $WriteLog "[defender] dism disable Windows-Defender-Default-Definitions"
    & Dism /Online /NoRestart /Disable-Feature /FeatureName:Windows-Defender-Default-Definitions 2>&1 | ForEach-Object { & $WriteLog "       $_" }

    # --- Remove Defender context-menu handlers ---
    Invoke-Op @{ op='regdel'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Directory\shellex\ContextMenuHandlers\EPP' }
    Invoke-Op @{ op='regdel'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Drive\shellex\ContextMenuHandlers\EPP' }
    Invoke-Op @{ op='regdel'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\*\shellex\ContextMenuHandlers\EPP' }

    # --- Remove SecurityHealth tray autostart ---
    Invoke-Op @{ op='regdel'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; v='SecurityHealth' }

    # --- Disable Defender scheduled tasks ---
    Invoke-Op @{ op='schtasks'; action='disable'; tn='Microsoft\Windows\ExploitGuard\ExploitGuard MDM policy Refresh' }
    Invoke-Op @{ op='schtasks'; action='disable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Cache Maintenance' }
    Invoke-Op @{ op='schtasks'; action='disable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Cleanup' }
    Invoke-Op @{ op='schtasks'; action='disable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Scheduled Scan' }
    Invoke-Op @{ op='schtasks'; action='disable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Verification' }

    & $WriteLog "[defender] disable complete"
}
elseif ($mode -eq 'enable') {

    & $WriteLog "[defender] mode=enable (restore defaults)"
    & $WriteLog "[warn] Tamper Protection must be turned OFF manually in Windows Security"
    & $WriteLog "[warn] before running this, otherwise many keys will be rejected/reverted."

    $ops = @(
        # --- Virus & threat protection -> manage settings ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Real-Time Protection'; v='DisableRealtimeMonitoring'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Real-Time Protection'; v='DisableAsyncScanOnOpen';      t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Spynet'; v='SpyNetReporting';       t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Spynet'; v='SubmitSamplesConsent'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Features'; v='TamperProtection'; t='REG_DWORD'; d='5' },

        # --- Controlled folder access on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Windows Defender Exploit Guard\Controlled Folder Access'; v='EnableControlledFolderAccess'; t='REG_DWORD'; d='1' },

        # --- Notifications back on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Notifications'; v='DisableEnhancedNotifications'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='NoActionNotificationDisabled';    t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='SummaryNotificationDisabled';     t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender Security Center\Virus and threat protection'; v='FilesBlockedNotificationDisabled'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableNotifications';            t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableDynamiclockNotifications';   t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows Defender Security Center\Account protection'; v='DisableWindowsHelloNotifications'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Epoch'; v='Epoch'; t='REG_DWORD'; d='1228' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\DomainProfile';   v='DisableNotifications'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\PublicProfile';   v='DisableNotifications'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile'; v='DisableNotifications'; t='REG_DWORD'; d='0' },

        # --- Smart App Control on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='VerifiedAndReputableTrustModeEnabled'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='SmartLockerMode'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='PUAProtection'; t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\AppID\Configuration\SMARTLOCKER'; v='START_PENDING'; t='REG_DWORD';  d='4' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\AppID\Configuration\SMARTLOCKER'; v='ENABLED';      t='REG_BINARY'; d='0400000000000000' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\CI\Policy'; v='VerifiedAndReputablePolicyState'; t='REG_DWORD'; d='1' },

        # --- Reputation-based protection / SmartScreen on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer'; v='SmartScreenEnabled'; t='REG_SZ'; d='Warn' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Edge\SmartScreenEnabled';    ve=$true; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Edge\SmartScreenPuaEnabled'; ve=$true; t='REG_DWORD'; d='1' },

        # --- Phishing protection on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='CaptureThreatWindow'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyMalicious';     t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyPasswordReuse'; t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='NotifyUnsafeApp';     t='REG_DWORD'; d='1' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\WTDS\Components'; v='ServiceEnabled';      t='REG_DWORD'; d='1' },

        # --- PUA protection on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender'; v='PUAProtection'; t='REG_DWORD'; d='1' },

        # --- SmartScreen for Store apps on ---
        @{ op='regadd'; k='HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\AppHost'; v='EnableWebContentEvaluation'; t='REG_DWORD'; d='1' },

        # --- Exploit protection defaults ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\Session Manager\kernel'; v='MitigationOptions'; t='REG_BINARY'; d='111111000001000000000000000000000000000000000000' },

        # --- Core isolation / memory integrity on ---
        @{ op='regdel';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='ChangedInBootCycle' },
        @{ op='regadd';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='Enabled'; t='REG_DWORD'; d='1' },
        @{ op='regadd';  k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'; v='WasEnabledBy'; t='REG_DWORD'; d='2' },

        # --- LSA protection on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa'; v='RunAsPPL'; t='REG_DWORD'; d='2' },

        # --- Vulnerable driver blocklist on ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\System\ControlSet001\Control\CI\Config'; v='VulnerableDriverBlocklistEnable'; t='REG_DWORD'; d='1' },

        # --- Defender services restored (manual/automatic) ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdNisSvc';            v='Start'; t='REG_DWORD'; d='3' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WinDefend';           v='Start'; t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\MDCoreSvc';           v='Start'; t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\wscsvc';              v='Start'; t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\webthreatdefsvc';     v='Start'; t='REG_DWORD'; d='3' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\webthreatdefusersvc'; v='Start'; t='REG_DWORD'; d='2' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\Sense';               v='Start'; t='REG_DWORD'; d='3' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\SecurityHealthService'; v='Start'; t='REG_DWORD'; d='2' },

        # --- Defender drivers restored (boot/system) ---
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdBoot';   v='Start'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdFilter'; v='Start'; t='REG_DWORD'; d='0' },
        @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\WdNisDrv'; v='Start'; t='REG_DWORD'; d='3' }
    )

    # Run every registry / bcdedit op.
    foreach ($op in $ops) { Invoke-Op $op }

    # --- Stop SmartScreen and move it back into System32 (best-effort) ---
    & $WriteLog "[defender] stopping smartscreen process"
    Stop-Process -Force -Name smartscreen -ErrorAction SilentlyContinue | Out-Null
    if (Test-Path "$env:SystemRoot\smartscreen.exe") {
        & $WriteLog "[defender] moving smartscreen.exe Windows -> System32"
        & cmd /c move /y "$env:SystemRoot\smartscreen.exe" "$env:SystemRoot\System32\smartscreen.exe" 2>&1 | ForEach-Object { & $WriteLog "       $_" }
        if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
            & $WriteLog "[warn] smartscreen move failed (exit=$LASTEXITCODE) - file may be locked"
        }
    }

    # NOTE: Windows-Defender-Default-Definitions cannot be re-enabled via
    # DISM once removed (commented out in the original script). Skipping.

    # --- Restore Defender context-menu handlers ---
    Invoke-Op @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Directory\shellex\ContextMenuHandlers\EPP'; ve=$true; t='REG_SZ'; d='{09A47860-11B0-4DA5-AFA5-26D86198A780}' }
    Invoke-Op @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Drive\shellex\ContextMenuHandlers\EPP';    ve=$true; t='REG_SZ'; d='{09A47860-11B0-4DA5-AFA5-26D86198A780}' }
    Invoke-Op @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Classes\*\shellex\ContextMenuHandlers\EPP';        ve=$true; t='REG_SZ'; d='{09A47860-11B0-4DA5-AFA5-26D86198A780}' }

    # --- Restore SecurityHealth tray autostart ---
    Invoke-Op @{ op='regadd'; k='HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'; v='SecurityHealth'; t='REG_EXPAND_SZ'; d='%windir%\system32\SecurityHealthSystray.exe' }

    # --- Re-enable Defender scheduled tasks ---
    Invoke-Op @{ op='schtasks'; action='enable'; tn='Microsoft\Windows\ExploitGuard\ExploitGuard MDM policy Refresh' }
    Invoke-Op @{ op='schtasks'; action='enable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Cache Maintenance' }
    Invoke-Op @{ op='schtasks'; action='enable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Cleanup' }
    Invoke-Op @{ op='schtasks'; action='enable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Scheduled Scan' }
    Invoke-Op @{ op='schtasks'; action='enable'; tn='Microsoft\Windows\Windows Defender\Windows Defender Verification' }

    & $WriteLog "[defender] enable complete"
}
else {
    & $WriteLog "[error] unknown mode '$mode' - expected 'disable' or 'enable'"
    return
}

& $WriteLog "[warn] REBOOT REQUIRED for service/driver/bcdedit changes to take effect"
