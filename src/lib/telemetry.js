// Opt-in local telemetry — never leaves the machine.

const KEY = 'ozboost.telemetry.v1'

function empty() {
  return {
    runs: 0,
    applied: 0,
    skipped: 0,
    failed: 0,
    byTweak: {}, // id → { ok, fail }
    lastAt: 0,
  }
}

export function loadTelemetry() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch { /* ignore */ }
  return data
}

/** Record one batch or single tweak outcome when telemetry is enabled. */
export function recordBatch(results, { enabled }) {
  if (!enabled || !Array.isArray(results)) return loadTelemetry()
  const data = loadTelemetry()
  data.runs += 1
  data.lastAt = Date.now()
  for (const r of results) {
    const id = r.tweakId || r.id
    if (!id) continue
    if (!data.byTweak[id]) data.byTweak[id] = { ok: 0, fail: 0 }
    if (r.applied || r.reverted) {
      data.applied += 1
      data.byTweak[id].ok += 1
    } else if (r.skipped) {
      data.skipped += 1
    } else if (!r.ok) {
      data.failed += 1
      data.byTweak[id].fail += 1
    }
  }
  return save(data)
}

export function topFailures(limit = 8) {
  const data = loadTelemetry()
  return Object.entries(data.byTweak)
    .map(([id, v]) => ({ id, fail: v.fail || 0, ok: v.ok || 0 }))
    .filter((x) => x.fail > 0)
    .sort((a, b) => b.fail - a.fail)
    .slice(0, limit)
}

export function resetTelemetry() {
  return save(empty())
}
