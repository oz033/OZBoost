// Crash-safe boost state — if the app dies mid-apply, we mark history on next start.

const KEY = 'ozboost.pending.v1'

export function loadPending() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setPending(payload) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...payload, startedAt: Date.now() }))
  } catch { /* ignore */ }
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}
