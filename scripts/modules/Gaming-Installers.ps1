#Requires -Version 5.1
<#
    Gaming launcher download-page opener.
    Simplified port of Ultimate/4 Installers/1 Installers.ps1.

    The original is an interactive menu that silently installs 24 launchers
    (with per-app config tuning). For OZBoost we don't bundle binaries;
    instead we open each official download page in the default browser so the
    user can install what they want. Start-Process <url> hands the URL to the
    registered default browser via the shell, same as the explorer.exe calls
    used elsewhere in the originals.

    Optional payload: $PayloadArgs.launchers = @('Steam','Discord',...) to open
    a subset. Omitted/empty -> open all.
#>

param($PayloadArgs, $WriteLog, $RequestOpen)

$ErrorActionPreference = 'Continue'

# Canonical launcher -> download URL map.
$launchers = [ordered]@{
    'Steam'             = 'https://store.steampowered.com/about/'
    'Discord'           = 'https://discord.com/download'
    'Battle.net'        = 'https://www.battle.net/download/'
    'Epic Games'        = 'https://www.epicgames.com/store/en-US/download'
    'Riot (Valorant)'   = 'https://playvalorant.com/en-gb/download/'
    'EA App'            = 'https://www.ea.com/ea-app'
    'Ubisoft Connect'   = 'https://ubisoftconnect.com/'
    'GOG Galaxy'        = 'https://www.gog.com/galaxy'
    'Roblox'            = 'https://www.roblox.com/download'
    'League of Legends' = 'https://signup.leagueoflegends.com/'
}

# Allow caller to scope to a subset by name.
$wanted = $PayloadArgs.launchers
if (-not $wanted) { $wanted = @($launchers.Keys) }

& $WriteLog "[gaming] opening $($wanted.Count) launcher download page(s)"

foreach ($name in $wanted) {
    if ($launchers.Contains($name)) {
        $url = $launchers[$name]
        # Emit an <OZB:OPEN> marker so the non-elevated Electron main process
        # opens the URL via shell.openExternal. We must NOT call Start-Process
        # here because this module runs elevated and the browser would launch
        # in the admin session, invisible to the user.
        & $WriteLog "[gaming] requesting open: $name -> $url"
        & $WriteLog "<OZB:OPEN>$url</OZB:OPEN>"
    }
    else {
        & $WriteLog "[gaming] unknown launcher '$name' (skipped)"
    }
}

& $WriteLog "[gaming] done"
