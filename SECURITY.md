# Security Policy

## Security model

OZBoost intentionally does privileged things — that is its job. The model:

- The app **self-elevates once** at startup (UAC prompt). All tweak execution
  runs through one generic PowerShell runner (`scripts/runTweak.ps1`) that
  only executes **declarative action lists**, never arbitrary strings from the UI.
- The renderer is sandboxed: `contextIsolation: true`, `nodeIntegration: false`.
  It can only reach the explicit `window.api` surface defined in
  `electron/preload.js`.
- Every IPC handler in `electron/main.js` validates its input (tweak ids,
  action types, area slugs) before anything reaches PowerShell.
- Elevated PowerShell must not open browsers/apps directly (they would run
  elevated and invisible); it emits `<OZB:OPEN>` markers that the main process
  opens in the normal user session instead.
- Before every apply, the affected registry values are snapshotted to
  `%APPDATA%/ozboost/backups/` for rollback.

## What OZBoost does NOT do

- No telemetry, no network calls except downloads the user explicitly triggers
  (tools, drivers — vendor pages or OZBoost-bundled fallbacks).
- No background services, no scheduled tasks, no autostart (except user choices).

## Known risk surface

- Tweaks in the **Experimental** tier disable security features (Defender,
  Firewall, VBS, 280+ services). They are clearly labeled, require an extra
  confirmation, and are meant for isolated gaming-only machines. This is a
  feature, not a vulnerability — but treat it as such.

## Reporting a vulnerability

Open a GitHub issue with the label `security`, or contact the maintainer
directly if the issue is sensitive. Please include reproduction steps.
You can expect an answer within a week.
