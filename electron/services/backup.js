'use strict'

// System Restore + granular JSON registry backup.
//
// Two layers of safety:
//   1. System Restore Point (Checkpoint-Computer) — coarse, system-wide.
//   2. JSON Registry Backup — fine-grained, per-apply. Before applying a tweak
//      we snapshot the current value of every reg key the tweak will touch,
//      timestamped, so a precise per-tweak revert is possible later.
//
// The JSON backups live in userData/backups/<tweakId>-<timestamp>.json and
// capture the EXACT prior state of the system (not a generic "default"),
// matching OZBoost's approach.

const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { runTweakElevated } = require('./powerShell')
const { runElevatedScript } = require('./powerShell')
const { readJsonSync } = require('./jsonUtils')

// Re-export so backup.js stays the single import surface for callers.
module.exports.runTweakElevated = runTweakElevated
module.exports.runElevatedScript = runElevatedScript

function backupsDir() {
  const d = path.join(app.getPath('userData'), 'backups')
  fs.mkdirSync(d, { recursive: true })
  return d
}

/**
 * Snapshot the current registry values a tweak is about to touch.
 * Stores { tweakId, ts, values: { "<hive>\path\value": {present, data} } }.
 * Returns the backup file path, or null if no reg actions / on failure.
 */
async function snapshotTweakRegistry(tweakId, actions) {
  const regActions = (actions || []).filter((a) => a.type === 'reg')
  if (regActions.length === 0) return null

  // Reuse the status reader to grab current values.
  const { exitCode, result } = await runElevatedScript(
    require('path').join(__dirname, '..', '..', 'scripts', 'readStatus.ps1'),
    { actions: regActions },
  )
  if (exitCode !== 0 || !result) return null

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {
    tweakId,
    ts,
    values: result,
  }
  const file = path.join(backupsDir(), `${tweakId}-${ts}.json`)
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), 'utf8')
  return file
}

/**
 * List all JSON backups, newest first.
 */
function listBackups() {
  const dir = backupsDir()
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const body = readJsonSync(path.join(dir, f))
        return { file: f, ...body }
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.ts.localeCompare(a.ts))
}

/**
 * System Restore point creation (unchanged from v0.1).
 */
function createRestorePoint(label, onLog) {
  const actions = [
    {
      type: 'reg',
      hive: 'HKLM',
      path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore',
      value: 'SystemRestorePointCreationFrequency',
      regType: 'REG_DWORD',
      data: '0',
    },
    { type: 'ps_module', code: 'Enable-ComputerRestore -Drive "C:\\"' },
    { type: 'ps_module', code: `Checkpoint-Computer -Description "${label}" -RestorePointType "MODIFY_SETTINGS"` },
    { type: 'reg', hive: 'HKLM', path: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore', value: 'SystemRestorePointCreationFrequency', action: 'delete' },
  ]
  return runTweakElevated({
    tweakId: 'backup_' + Date.now(),
    action: 'apply',
    actions,
    onLog,
  })
}

module.exports = { createRestorePoint, snapshotTweakRegistry, listBackups, backupsDir }
