# Contributing to OZBoost

Thanks for wanting to help! This document explains the project layout, how to
add a tweak, and what a good PR looks like.

## Project layout

```
electron/               Main process
  main.js               Window, self-elevation, validated IPC handlers
  preload.js            The ONLY bridge the renderer sees (window.api)
  services/             powerShell.js (runner), backup.js, state.js, logger.js
scripts/                PowerShell layer (PS 5.1!)
  runTweak.ps1          Generic action-list runner (reg/cmd/service/appx/…)
  readStatus.ps1        Bulk registry status reader
  systemAnalysis.ps1    Hardware + settings analysis (JSON out)
  systemCleaner.ps1     Cache scan/clean (JSON out)
  modules/              Complex tweaks as standalone modules
src/                    Renderer (React + Vite)
  data/                 ALL tweaks as declarative data — no logic here
  lib/                  optimizer.js (engine), scoring.js, readiness.js, logging.js
  views/                Pages (Home, Tools)
  components/           UI building blocks
  lib/i18n.js           DE/EN strings
```

## Adding a tweak

1. Add a data object to the right file in `src/data/tweaks*.js`:

```js
{
  id: 'my_tweak',                    // snake_case, unique
  category: 'windows',
  title: 'Kurzer Titel',
  summary: 'Ein Satz: was es tut und was es kostet.',
  risk: 'low' | 'medium' | 'high',
  requiresReboot: false,
  requiresAdmin: true,
  source: 'OZBoost',  // internal origin tag
  actions: {
    apply:  [{ type: 'reg', hive: 'HKLM', path: '…', value: '…', regType: 'REG_DWORD', data: '1' }],
    revert: [{ type: 'reg', hive: 'HKLM', path: '…', value: '…', action: 'delete' }],
  },
}
```

2. Add a plain-language benefit to `src/data/benefits.js` (what does the user
   gain, in one sentence — no fantasy FPS numbers).
3. Assign it to a tier in `src/data/presets.js` (`safe` / `strong` / `experimental`)
   by its actual risk.
4. If the tweak needs logic that the generic action types can't express, write
   a module in `scripts/modules/MyThing.ps1` — **PowerShell 5.1 compatible**
   (no `??`, no ternary, no `&&` chains) — and call it with
   `{ type: 'ps_module', module: 'MyThing', args: {…} }`.

Rules:

- **Every tweak needs a revert** unless it is genuinely one-shot (downloads,
  cleanup). High-risk tweaks without revert get flagged by the optimizer engine.
- Never call `Start-Process` for URLs/settings pages inside elevated modules —
  use the provided `$RequestOpen` function; the non-elevated main process
  opens the target in the user session.
- Descriptions are honest German plain language. Mark experimental things as such.

## Code style

- `npm run lint` and `npm run format:check` must pass.
- JS/JSX, no TypeScript (yet — see roadmap in the README).
- Comments explain *why*, not *what*. German or English both fine, match the file.

## PRs

- One topic per PR.
- Describe what you changed and how you verified it (screenshots welcome).
- The renderer must build (`npm run build`) and the app must start (`npm run dev`).
