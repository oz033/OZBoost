// =============================================================================
// Zentrale Optimizer-Engine.
// =============================================================================

import { log } from './logging'

export const SkipReason = {
  ALREADY_ACTIVE:    'Bereits aktiv — übersprungen',
  NOT_SUPPORTED:     'Auf diesem System nicht unterstützt',
  NO_ADMIN:          'Admin-Rechte erforderlich',
  NO_ROLLBACK:       'Kein Rollback verfügbar — übersprungen (high-risk ohne Revert)',
  USER_CANCELLED:    'Vom Nutzer abgebrochen',
}

export async function optimize(tweak, ctx, options = {}) {
  const { state = {}, liveStatus = {} } = ctx
  const { force = false, skipChecks = false } = options

  if (!tweak) return { ok: false, error: 'Tweak nicht gefunden' }
  const t0 = Date.now()

  log.info(`Prüfe: ${tweak.title}`, 'search', tweak.id)

  if (!skipChecks) {
    const isActive = state[tweak.id]?.status === 'applied' || liveStatus[tweak.id] === 'applied'
    if (isActive && !force) {
      log.skip(`${tweak.title} — ${SkipReason.ALREADY_ACTIVE}`, 'skip', tweak.id)
      return { ok: true, applied: false, skipped: true, reason: SkipReason.ALREADY_ACTIVE, durationMs: Date.now() - t0 }
    }

    if (!tweak.actions?.apply || tweak.actions.apply.length === 0) {
      log.skip(`${tweak.title} — ${SkipReason.NOT_SUPPORTED}`, 'skip', tweak.id)
      return { ok: true, applied: false, skipped: true, reason: SkipReason.NOT_SUPPORTED, durationMs: Date.now() - t0 }
    }

    if (!tweak.actions?.revert || tweak.actions.revert.length === 0) {
      if (tweak.risk === 'high') {
        log.warn(`${tweak.title} — ${SkipReason.NO_ROLLBACK}`, 'warning', tweak.id)
      }
    }
  }

  log.info(`Wende an: ${tweak.title}`, 'settings', tweak.id)

  let result
  try {
    result = await window.api.runTweak({
      tweakId: tweak.id,
      action: 'apply',
      actions: tweak.actions.apply,
    })
  } catch (err) {
    log.error(`${tweak.title} — Exception: ${err.message}`, 'close', tweak.id)
    return { ok: false, applied: false, error: err.message, durationMs: Date.now() - t0 }
  }

  const durationMs = Date.now() - t0

  if (result.exitCode !== 0) {
    const errMsg = result.error || `Exit-Code ${result.exitCode}`
    log.error(`${tweak.title} fehlgeschlagen: ${errMsg}`, 'close', tweak.id)
    return { ok: false, applied: false, error: errMsg, durationMs }
  }

  log.success(`${tweak.title} aktiviert`, 'check', tweak.id)

  if (tweak.requiresReboot) {
    log.warn(`${tweak.title} — Neustart erforderlich!`, 'refresh', tweak.id)
  }

  return { ok: true, applied: true, skipped: false, durationMs, requiresReboot: !!tweak.requiresReboot }
}

export async function optimizeAll(tweaks, ctx, options = {}) {
  const { onProgress = null } = options
  const results = []

  const pending = tweaks.filter((t) => t && ctx.state?.[t.id]?.status !== 'applied' && ctx.liveStatus?.[t.id] !== 'applied')

  log.info(`Batch: ${pending.length} von ${tweaks.length} Tweaks ausstehend`, 'package')

  for (let i = 0; i < pending.length; i++) {
    const tweak = pending[i]
    const result = await optimize(tweak, ctx, options)
    results.push({ tweakId: tweak.id, ...result })
    if (onProgress) onProgress(i + 1, pending.length, result)
  }

  const applied = results.filter((r) => r.applied).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !r.ok).length

  log.info(`Batch fertig: ${applied} angewendet, ${skipped} übersprungen, ${failed} fehlgeschlagen`, 'list')

  return { results, applied, skipped, failed, total: pending.length }
}

export async function revert(tweak) {
  if (!tweak) return { ok: false, error: 'Tweak nicht gefunden' }
  const t0 = Date.now()

  if (!tweak.actions?.revert || tweak.actions.revert.length === 0) {
    log.error(`${tweak.title} — kein Rollback möglich`, 'close', tweak.id)
    return { ok: false, error: 'Kein Rollback verfügbar' }
  }

  log.info(`Revert: ${tweak.title}`, 'undo', tweak.id)

  let result
  try {
    result = await window.api.runTweak({
      tweakId: tweak.id,
      action: 'revert',
      actions: tweak.actions.revert,
    })
  } catch (err) {
    log.error(`${tweak.title} Revert — Exception: ${err.message}`, 'close', tweak.id)
    return { ok: false, error: err.message, durationMs: Date.now() - t0 }
  }

  if (result.exitCode !== 0) {
    const errMsg = result.error || `Exit-Code ${result.exitCode}`
    log.error(`${tweak.title} Revert fehlgeschlagen: ${errMsg}`, 'close', tweak.id)
    return { ok: false, error: errMsg, durationMs: Date.now() - t0 }
  }

  log.success(`${tweak.title} zurückgesetzt`, 'undo', tweak.id)
  return { ok: true, applied: false, reverted: true, durationMs: Date.now() - t0 }
}
