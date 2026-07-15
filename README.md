# OZBoost

Gaming performance optimizer for Windows — analyze, optimize, clean, and restore.

**Made by OZ.**

![status](https://img.shields.io/badge/status-1.0.5-green) ![platform](https://img.shields.io/badge/platform-Windows%2011-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

OZBoost is a desktop app for Windows gaming PCs: live system analysis, selectable boost packages, bloatware removal, cache cleaning, startup control, and backups with per-tweak rollback.

---

## Disclaimer

These tweaks modify the Windows registry, services, and drivers. OZBoost can create a System Restore Point and registry snapshots — but **you use this software at your own risk**.

OZBoost does not promise specific FPS numbers. Gains depend on hardware and what is limiting the system. **Max** intensity is only for isolated gaming machines.

---

## Features

- **Home** — Scan → score → Safe / Strong / Max → full selectable package → apply
- **Cleaner** — cache areas with size before delete
- **Tools** — bloatware selection + expert tweaks
- **Settings** — theme, language, history, startup apps, About (**Made by OZ**)
- **Safety** — restore point before Max, snapshots, fail list after boost

## Install

See [INSTALL.md](INSTALL.md). Short version:

```bash
cd OZDebloat
npm install
npm run dev
npm run dist:portable
```

## License

[MIT](LICENSE) — Made by OZ.
