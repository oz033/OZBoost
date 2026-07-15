// Persistent UI prefs (theme + language). Survives restarts.

const KEY = 'ozboost.prefs.v1'

const DEFAULTS = {
  theme: 'dark', // always start dark by default
  lang: 'de',    // 'de' | 'en'
  telemetry: false,
  autoUpdate: true,
}

// One-time: prefer dark as default start theme.
try {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    const p = JSON.parse(raw)
    if (p && !p._darkStartV1) {
      p.theme = 'dark'
      p._darkStartV1 = true
      localStorage.setItem(KEY, JSON.stringify(p))
    }
  }
} catch { /* ignore */ }

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePrefs(partial) {
  const next = { ...loadPrefs(), ...partial }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* ignore quota */ }
  return next
}

/** Resolve effective theme considering system preference. */
export function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return 'dark'
}

export function applyThemeToDom(theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.style.colorScheme = resolved
  // Keep Windows caption buttons (min/max/close) in sync — they are native, not CSS.
  try {
    window.api?.setThemeChrome?.(resolved)
  } catch { /* preload may not exist yet */ }
  return resolved
}
