// =============================================================================
// Zentrale Logging-Komponente für OZBoost.
// =============================================================================
// Sammelt alle Optimierungs-Events in einem In-Memory-Log (max 200 Einträge).
// Wird im Activity Feed angezeigt und kann in eine Datei geschrieben werden.

const MAX_ENTRIES = 200
const _entries = []
const _listeners = new Set()

function push(entry) {
  _entries.unshift({
    ts: Date.now(),
    time: new Date().toLocaleTimeString('de-DE'),
    ...entry,
  })
  if (_entries.length > MAX_ENTRIES) _entries.length = MAX_ENTRIES
  _listeners.forEach((fn) => fn(_entries[0]))

  // Zusätzlich in die zentrale Logdatei des Main-Prozesses (fire-and-forget),
  // damit Fehler auch nach App-Neustart nachvollziehbar sind.
  try {
    window.api?.writeLog?.(entry.level, entry.text)
  } catch { /* Logging darf nie werfen */ }
}

export const log = {
  info(text, icon = 'info', tweakId = null) {
    push({ level: 'info', text, icon, tweakId })
  },
  success(text, icon = 'check', tweakId = null) {
    push({ level: 'success', text, icon, tweakId })
  },
  warn(text, icon = 'warning', tweakId = null) {
    push({ level: 'warn', text, icon, tweakId })
  },
  error(text, icon = 'close', tweakId = null) {
    push({ level: 'error', text, icon, tweakId })
  },
  skip(text, icon = 'skip', tweakId = null) {
    push({ level: 'skip', text, icon, tweakId })
  },

  all() { return [..._entries] },
  subscribe(fn) {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
  },
  clear() { _entries.length = 0; _listeners.forEach((fn) => fn(null)) },
}
