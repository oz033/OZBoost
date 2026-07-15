# Design — OZBoost

Locked design system for the OZBoost Windows gaming optimizer (Electron + React).
Product UI, not marketing. Prefer clarity and safety over spectacle.

## Genre

**modern-minimal / utilitarian product chrome**

## Macrostructure family

- App pages: **Workbench** — score/metrics, selection lists, solid panels
- No landing-page heroes, no specimen/editorial left-margin labels

## Theme

Default start: **dark**. User can switch light/dark (titlebar + Settings).

### Light (soft white/gray)

| Token | Value |
| --- | --- |
| paper / base | `#e5e5ea` |
| elevated panels | `#f0f0f3` |
| card hover | `#eaeaee` |
| chrome / titlebar | `#ebebef` |
| sidebar | `#e0e0e6` |
| border subtle | `rgba(60, 60, 67, 0.18)` |
| border strong | `rgba(60, 60, 67, 0.28)` |
| accent | `#ff3b30` (iOS system red) |
| text primary | `#1c1c1e` |

### Dark

| Token | Value |
| --- | --- |
| paper / base | `#0c0c0e` |
| elevated | `#161618` |
| chrome | `#121214` |
| accent | `#ff453a` |
| text primary | `#f5f5f7` |

Native Windows caption buttons follow theme via `setTitleBarOverlay`.

## Typography

- Body/UI: system stack (`-apple-system`, `Segoe UI`, `system-ui`)
- Mono: `SF Mono` / `Cascadia Code` for logs only
- Headings: roman, no italic display headers
- Metrics: `tabular-nums`

## Components

- **Buttons**: solid fill primary (`--accent`), outline secondary with 1–1.5px border. No liquid-glass / chrome-gloss experiments.
- **Lists**: package rows, cleaner areas — gray selection, not red wash.
- **Titlebar**: logo left · search center · DE/EN + dark/light right (padding for caption buttons).
- **Cards**: elevated surface + visible but soft gray border (~28% strong).

## Motion

- Ease-out only on UI; no bounce/overshoot.
- Press: optional opacity, avoid scale-zoo.
- `prefers-reduced-motion` respected.

## Copy / honesty

- No invented FPS guarantees. Potential labels are estimates or omitted.
- After boost: before/after score, RAM %, process count + fail list.
- Max intensity: restore point required before apply.

## Credits

Made by **OZ**.

## Anti-patterns (do not reintroduce)

- Purple gradients, Inter-only marketing heroes
- Full-viewport centered glass orbs as primary chrome
- iOS liquid-glass button redesign loops without user approval
- Fabricated metrics (“+47% FPS”)

## Exports

Tokens live in `src/styles/theme.css` (`:root` / `[data-theme]`). Keep CSS custom properties as the single source of truth.
