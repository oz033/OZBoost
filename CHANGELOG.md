# Changelog

All notable changes to OZBoost. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.6] — 2026-07-15

### Fixed
- **Scan / Cleaner / Startup / Ping failed** with “Analyse fehlgeschlagen”: PowerShell
  result files were never written when script paths contained spaces or asar
  resolution missed `app.asar.unpacked`. Runner now uses space-safe `-Command`
  invocation, multi-candidate script resolution, and always returns a JSON error.

## [1.0.5] — 2026-07-15

### Added
- **Startup apps** (Settings): list / disable / re-enable user HKCU Run entries.
- **History per-entry Revert** for individual applied tweaks.
- **Fail list** after Boost (title + error) in the before/after panel.
- **Windows build** line on Home after scan.
- **Max safety**: System Restore Point is created before Max; apply aborts if it fails.
- **About**: “Made by OZ” credit next to version and source links.
- Titlebar: DE/EN, dark/light toggles; search centered; dark default start.
- `DESIGN.md` design lock for product chrome.

### Changed
- Light theme: soft white/gray workbench (not heavy gray, not pure white).
- Native window caption buttons follow light/dark theme.
- Version **1.0.5**.

### Fixed
- Theme switch left Windows min/max/close on a dark strip in light mode.

## [1.0.4] — 2026-07-15

### Added
- Before/after metrics after Boost (score, RAM %, processes).
- Change history + Revert all (Settings).
- Local opt-in tweak success/fail stats (no upload).
- Tray menu: show, Safe Boost, Cleaner, quit (close → tray on Windows).
- Update check wiring (`electron-updater`, needs GitHub Releases).
- GitHub issue templates (tweak broken / bug).

### Changed
- Hallmark Workbench shell/home/tools; solid buttons after glass experiments.
- Honest metrics (no FPS claim presentation as fact).

## [1.0.0] — 2026-07-15

Production-ready release (portable: `OZBoost-1.0.0-portable.exe`).

### Added
- **Home Booster flow**: Scan on demand → score → Safe/Strong/Max
  → full boost package list with checkboxes → apply selection with confirm.
- Theme Dark / Light / System; i18n DE + EN.
- Bloatware remover, System Cleaner, Tools expert tweaks.
- Registry snapshots, central logging, IPC validation.
- Docs: README, INSTALL, CONTRIBUTING, SECURITY, FAQ, LICENSE (MIT).

### Changed
- Nav: Home · Cleaner · Tools · Settings.
- Boost applies only the user’s selection.

### Fixed
- Elevated PS logging/path issues; bulk status check; asar unpack for scripts.

## [0.9.0] — 2026-07-14

- Dashboard redesign, optimizer engine, Gaming Readiness, Cleaner, self-elevation.

## [0.6.0 – 0.8.0] — 2026-07-13

- Tools page, selection modals, winget helpers, elevated-PS path fixes.

## [0.1.0 – 0.5.2] — 2026-07-10

- Initial tweak model, PS runner, presets, dry-run, backups.
