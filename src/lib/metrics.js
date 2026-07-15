// Honest system snapshot for before/after — real numbers only, no invented FPS claims.

import { computeScore } from './scoring'

export function snapshotFromAnalysis(analysis) {
  if (!analysis || analysis.error) {
    return { ok: false, score: null, ramUsedPct: null, processCount: null }
  }
  const score = computeScore(analysis)
  return {
    ok: true,
    score: score?.score ?? null,
    ramUsedPct: analysis.ram?.usedPercent ?? null,
    processCount: analysis.background?.processCount ?? null,
    // Potential is heuristic only — kept for optional grey label, not as "proof"
    potentialNote: true,
  }
}

export function deltaNum(before, after) {
  if (before == null || after == null) return null
  return after - before
}

export function formatDelta(n, { suffix = '' } = {}) {
  if (n == null || Number.isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n}${suffix}`
}
