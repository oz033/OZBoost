// Local change history (renderer). Survives restarts via localStorage.

const KEY = 'ozboost.history.v1'
const MAX = 100

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function pushHistory(entry) {
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      ...entry,
    },
    ...loadHistory(),
  ].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* quota */ }
  return next
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
  return []
}

/** Mark a single history entry as reverted (by id). */
export function markHistoryReverted(entryId) {
  const list = loadHistory().map((h) =>
    h.id === entryId ? { ...h, reverted: true, revertedAt: Date.now() } : h,
  )
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* ignore */ }
  return list
}
