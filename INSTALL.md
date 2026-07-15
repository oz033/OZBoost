# Installing OZBoost

## Requirements

- Windows 11 (Windows 10 22H2 mostly works, but is not the test target)
- For development: Node.js ≥ 20 and npm
- PowerShell 5.1 (ships with Windows — no PowerShell 7 required)

## Users: installer / portable build

Download the latest release from the GitHub Releases page and run the installer,
or use the portable `.exe` (no installation, settings stored next to the app).

On first start Windows will show a UAC prompt: OZBoost elevates **once** at
startup so it can read and write HKLM registry keys and service settings
without prompting for every single tweak.

## Developers

```bash
git clone <repo-url>
cd OZDebloat
npm install

# Development: Vite dev server + Electron with hot reload
npm run dev

# Quality gates
npm run lint            # ESLint (electron/ + src/)
npm run format:check    # Prettier

# Production build
npm run build           # renderer only (dist/renderer)
npm run dist            # full Windows installer via electron-builder
npm run dist:portable   # portable single-exe build
```

In development the app does **not** self-elevate (so your editor/terminal keeps
its normal rights). Tweaks then fall back to a per-action UAC prompt.

## Where OZBoost stores data

| What | Where |
|---|---|
| Tweak state (applied/reverted) | `%APPDATA%/ozboost/ozboost-state.json` |
| Registry snapshots (pre-change backups) | `%APPDATA%/ozboost/backups/` |
| Logs (14 days) | `%APPDATA%/ozboost/logs/` |
| Temp artifacts of PowerShell runs | `%TEMP%/ozboost/` |

## Uninstall

Uninstall via Windows settings (installer build) or delete the portable exe.
Applied tweaks stay applied — revert them from within the app first if you
want a stock system, or use the System Restore Point you created.
