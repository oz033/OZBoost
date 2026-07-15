'use strict'

// PowerShell execution service.
//
// Strategy: tweaks that only need HKCU / non-admin operations could run in-process,
// but every OZBoost tweak touches HKLM and needs elevation. To keep things uniform
// and to surface a real UAC prompt, we ALWAYS run via an elevated child process.
//
// Flow:
//   1. Build an actions payload { action: 'apply'|'revert', actions: [...] }
//   2. Write it to a temp JSON file.
//   3. Launch runTweak.ps1 elevated (ShellExecute 'runas'), pointing at the payload.
//   4. The PS script streams <OZB:LOG>...</OZB:LOG> lines to stdout for live UI.
//   5. On completion the script writes <OZB:DONE exitCode="N"/> and exits.
//
// Because Start-Process -Verb RunAs detaches the process (we cannot capture its
// stdout directly), the elevated script writes log lines to a temp .log file which
// the (non-elevated) main process tails. This is the standard Electron+UAC pattern.

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { readJsonSync } = require('./jsonUtils')

// Resolve script paths lazily — process.resourcesPath is reliable once Electron runs.
function getRunner() {
  return resolveScriptPath('runTweak.ps1') || path.join(appScriptsDir(), 'runTweak.ps1')
}
function getStatusReader() {
  return resolveScriptPath('readStatus.ps1') || path.join(appScriptsDir(), 'readStatus.ps1')
}

// Cached: ist die App schon Admin? Wird beim ersten runTweakElevated-Aufruf
// geprüft und gecachtet, damit wir nicht bei jedem Tweak 'net session' rufen.
let _isAdminCache = null

function unpackAsarPath(p) {
  // Only rewrite the asar archive segment, never "app.asar.unpacked".
  return String(p).replace(/app\.asar(?!\.unpacked)/g, 'app.asar.unpacked')
}

function appScriptsDir() {
  // Prefer real on-disk candidates. PowerShell cannot read files inside asar.
  const candidates = [
    process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts')
      : null,
    process.resourcesPath
      ? path.join(process.resourcesPath, 'scripts')
      : null,
    unpackAsarPath(path.join(__dirname, '..', '..', 'scripts')),
    path.join(__dirname, '..', '..', 'scripts'),
  ].filter(Boolean)

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir)) return dir
    } catch { /* try next */ }
  }
  return candidates[0]
}

/** Resolve a scripts/*.ps1 path that PowerShell can actually open. */
function resolveScriptPath(scriptName) {
  const name = path.basename(String(scriptName || ''))
  // Only bare script names — no path traversal.
  if (!/^[A-Za-z0-9_.-]+\.ps1$/.test(name)) return null

  const candidates = [
    path.join(appScriptsDir(), name),
    process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts', name)
      : null,
    unpackAsarPath(path.join(__dirname, '..', '..', 'scripts', name)),
    path.join(__dirname, '..', '..', 'scripts', name),
  ].filter(Boolean)

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch { /* try next */ }
  }
  return candidates[0] || null
}

function tempDir() {
  const d = path.join(os.tmpdir(), 'ozboost')
  fs.mkdirSync(d, { recursive: true })
  return d
}

/**
 * Translate the high-level action list into a human-readable preview,
 * and simultaneously into the JSON the PS runner consumes. Both use the
 * same shape; `preview` just formats for display.
 */
function previewTweak(action, actions) {
  const items = (actions || []).map((a) => formatAction(a))
  return { action, items }
}

function formatAction(a) {
  switch (a.type) {
    case 'reg':
      if (a.action === 'delete') {
        return { kind: 'reg', label: `Delete  ${a.hive}\\${a.path}${a.value ? ' → ' + a.value : ''}` }
      }
      return { kind: 'reg', label: `Set     ${a.hive}\\${a.path} → ${a.value} = ${a.data} (${a.regType})` }
    case 'cmd':
      return { kind: 'cmd', label: `Run     ${a.command}` }
    case 'service':
      return { kind: 'svc', label: `Service ${a.name} → start=${a.start}` }
    case 'powercfg':
      return { kind: 'cfg', label: `Power   plan ${a.plan} ${a.subgroup ? a.subgroup + '/' + a.setting : ''} ac=${a.ac} dc=${a.dc}` }
    case 'appx':
      return { kind: 'appx', label: `AppX    ${a.action} ${a.name || '(pattern)'}` }
    case 'task':
      return { kind: 'task', label: `Task    ${a.action} ${a.name}` }
    case 'file':
      return { kind: 'file', label: `File    ${a.action} ${a.target}` }
    case 'ps_module':
      return { kind: 'ps', label: a.module ? `Module  ${a.module}` : `Inline  PS script (${a.code ? a.code.length : 0} chars)` }
    case 'reg_file':
      return { kind: 'reg', label: `Import  reg-file (${a.content ? a.content.length : 0} chars)` }
    case 'net_binding':
      return { kind: 'net', label: `${a.action} binding ${(a.components || []).join(', ')}` }
    case 'open':
      return { kind: 'open', label: `Open    ${a.target}` }
    case 'sc':
      return { kind: 'svc', label: `sc.exe  ${a.action} ${a.name}` }
    case 'msi':
      return { kind: 'msi', label: `MSI     ${a.action} ${a.name}` }
    default:
      return { kind: '?', label: JSON.stringify(a) }
  }
}

/**
 * Run a tweak elevated. Resolves { exitCode, elevated }.
 * onLog(line) is called for each streamed log line.
 * onOpen(target) is called when the elevated script requests a browser /
 *   settings page / executable open (since Start-Process from elevated PS
 *   launches in the admin session and is invisible to the user).
 */
function runTweakElevated({ tweakId, action, actions, onLog, onOpen }) {
  return new Promise((resolve) => {
    const dir = tempDir()
    const payloadFile = path.join(dir, `${tweakId}.${action}.payload.json`)
    const logFile = path.join(dir, `${tweakId}.${action}.log`)
    const doneFile = path.join(dir, `${tweakId}.${action}.done`)

    // Clean previous run artifacts.
    ;[payloadFile, logFile, doneFile].forEach((f) => {
      try { fs.unlinkSync(f) } catch { /* ignore */ }
    })

    const payload = { tweakId, action, actions: actions || [] }
    fs.writeFileSync(payloadFile, JSON.stringify(payload), 'utf8')

    // Start a tailing loop on the log file *before* the child starts.
    let stopTail = false
    let lastSize = 0
    const tail = () => {
      if (stopTail) return
      try {
        const stat = fs.statSync(logFile)
        if (stat.size > lastSize) {
          const fd = fs.openSync(logFile, 'r')
          const buf = Buffer.alloc(stat.size - lastSize)
          fs.readSync(fd, buf, 0, buf.length, lastSize)
          fs.closeSync(fd)
          lastSize = stat.size
          buf.toString('utf8').split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim()
            if (!trimmed) return
            // Detect <OZB:OPEN>target</OZB:OPEN> markers emitted by elevated
            // PS for browser/settings opens. Hand them to the non-elevated
            // onOpen callback instead of Start-Process (which would launch in
            // the admin session and be invisible to the user). Do NOT pass
            // marker lines to onLog — they're internal protocol.
            const m = trimmed.match(/^<OZB:OPEN>(.+)<\/OZB:OPEN>$/)
            if (m) {
              if (onOpen) onOpen(m[1])
              return
            }
            onLog(trimmed)
          })
        }
      } catch { /* file may not exist yet */ }
      if (!stopTail) setTimeout(tail, 150)
    }
    setTimeout(tail, 100)

    // ─── Admin-Detection (cached) ───
    // Wenn die App schon elevated ist (self-elevation beim Start), können wir
    // PowerShell direkt spawnen — KEIN UAC-Prompt pro Tweak. Das ist der
    // kritische UX-Fix: 1× UAC beim App-Start, dann nie wieder.
    if (_isAdminCache === null) {
      try { execSync('net session', { stdio: 'ignore', windowsHide: true }); _isAdminCache = true }
      catch { _isAdminCache = false }
    }

    let child
    let stderrBuf = ''
    if (_isAdminCache) {
      // ─── Fast path: App ist Admin → PowerShell direkt, kein UAC. ───
      // WICHTIG: der Log-File-Tail muss trotzdem laufen — der Runner schreibt
      // alle Zeilen (inkl. <OZB:OPEN>-Marker für Browser/Settings-Opens) per
      // Write-Log ins LogFile, nicht auf stdout. Ohne Tail: keine Live-Logs
      // und keine Seiten-Öffnung (genau dieser Bug trat nach der
      // Self-Elevation-Umstellung auf).
      child = spawn('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo',
        '-File', getRunner(),
        '-PayloadFile', payloadFile,
        '-LogFile', logFile,
        '-DoneFile', doneFile,
      ], { windowsHide: true })
    } else {
      // ─── Legacy path: Non-Admin → Start-Process -Verb RunAs (UAC). ───
      child = spawn('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo',
        '-Command',
        `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList ` +
        `'-NoProfile','-ExecutionPolicy','Bypass','-File','${quotedPsArg(getRunner())}',` +
        `'-PayloadFile','${quotedPsArg(payloadFile)}','-LogFile','${quotedPsArg(logFile)}','-DoneFile','${quotedPsArg(doneFile)}'`,
      ], { windowsHide: true })
    }

    // stderr in beiden Pfaden sammeln — für UAC-Abbruch-Erkennung und Diagnose.
    if (child.stderr) child.stderr.on('data', (d) => { stderrBuf += d.toString() })

    child.on('error', (err) => {
      stopTail = true
      onLog(`[error] ${err.message}`)
      resolve({ exitCode: 1, elevated: false, error: err.message })
    })

    child.on('close', () => {
      // Give the log tail one last pass before stopping it.
      setTimeout(() => {
        stopTail = true
        let exitCode = 1
        let error
        try {
          const done = fs.readFileSync(doneFile, 'utf8').trim()
          const m = done.match(/exitCode="(-?\d+)"/)
          if (m) exitCode = parseInt(m[1], 10)
        } catch {
          // No done file → the elevated runner never ran. Most common cause:
          // the user declined the UAC prompt (Start-Process -Verb RunAs throws).
          if (uacDeclined(stderrBuf)) {
            error = 'UAC abgelehnt — Aktion wurde nicht ausgeführt.'
            onLog(`[error] ${error}`)
          } else {
            error = 'Elevated PowerShell lieferte keine Rückmeldung.'
            if (stderrBuf.trim()) onLog(`[error] ${stderrBuf.trim().split(/\r?\n/)[0]}`)
          }
        }
        resolve({ exitCode, elevated: true, error })
      }, 400)
    })
  })
}

function uacDeclined(stderr) {
  // en: "The operation was canceled by the user." / de: "Der Vorgang wurde durch den Benutzer abgebrochen."
  return /canceled by the user|abgebrochen/i.test(stderr || '')
}

function escapeForPs(s) {
  // We pass paths inside single quotes; the only char we must escape is the single quote itself.
  return s.replace(/'/g, "''")
}

function quotedPsArg(s) {
  // Start-Process -ArgumentList joins items with spaces WITHOUT quoting, so a
  // path like "D:\arbeit\zcode project\..." would be split at the space by the
  // elevated powershell. Embed literal double quotes around the value.
  return `"${escapeForPs(s)}"`
}

/**
 * Generic elevated PS launcher: runs <script> with -PayloadFile + -ResultFile
 * (or -LogFile/-DoneFile for runTweak). Returns { exitCode, result? }.
 *
 * Used by readTweakStatus() to query HKLM values without per-tweak UAC spam.
 * We skip the log-tail because status reads are silent and fast.
 */
function runElevatedScript(scriptPath, payload, { resultKey = 'ResultFile' } = {}) {
  return new Promise((resolve) => {
    const dir = tempDir()
    const tag = `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const payloadFile = path.join(dir, `${tag}.payload.json`)
    const resultFile = path.join(dir, `${tag}.result.json`)

    ;[payloadFile, resultFile].forEach((f) => { try { fs.unlinkSync(f) } catch { /* */ } })
    fs.writeFileSync(payloadFile, JSON.stringify(payload), 'utf8')

    if (_isAdminCache === null) {
      try { execSync('net session', { stdio: 'ignore', windowsHide: true }); _isAdminCache = true }
      catch { _isAdminCache = false }
    }

    let child
    if (_isAdminCache) {
      // Fast path: direkt spawnen, kein UAC.
      child = spawn('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo',
        '-File', scriptPath,
        '-PayloadFile', payloadFile,
        `-${resultKey}`, resultFile,
      ], { windowsHide: true })
    } else {
      child = spawn('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo',
        '-Command',
        `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList ` +
        `'-NoProfile','-ExecutionPolicy','Bypass','-File','${quotedPsArg(scriptPath)}',` +
        `'-PayloadFile','${quotedPsArg(payloadFile)}','-${resultKey}','${quotedPsArg(resultFile)}'`,
      ], { windowsHide: true })
    }

    child.on('error', (err) => resolve({ exitCode: 1, error: err.message }))
    child.on('close', () => {
      try {
        const result = readJsonSync(resultFile)
        resolve({ exitCode: 0, result })
      } catch {
        resolve({ exitCode: 1 })
      }
    })
  })
}

/**
 * Compare a tweak's apply-actions against the live registry.
 * Returns: 'applied' | 'not_applied' | 'partial' | 'unknown'
 *
 * Only `reg` actions are compared; if a tweak has non-reg actions (ps_module,
 * cmd, service, appx), we can't cheaply introspect them → 'unknown'.
 * Tweaks with mostly reg actions: 'applied' if all present with matching data,
 * 'partial' if some match, 'not_applied' if none match.
 */
async function readTweakStatus(actions) {
  const regActions = (actions || []).filter((a) => a.type === 'reg' && a.action !== 'delete')
  if (regActions.length === 0) return 'unknown'

  const { exitCode, result } = await runElevatedScript(getStatusReader(), { actions: regActions })
  if (exitCode !== 0 || !result) return 'unknown'

  let matched = 0
  let totalChecked = 0
  for (const a of regActions) {
    const lookupKey = `${a.hive}\\${a.path}\\${a.value}`
    const entry = result[lookupKey]
    if (!entry) continue
    totalChecked++
    if (entry.present && entry.data === String(a.data)) matched++
  }

  if (totalChecked === 0) return 'unknown'
  if (matched === totalChecked) return 'applied'
  if (matched === 0) return 'not_applied'
  return 'partial'
}

/**
 * Bulk variant of readTweakStatus: ONE elevated call for ALL tweaks instead of
 * one UAC prompt per tweak. Input: [{ id, actions }], output: { id: status }.
 */
async function readTweakStatusBulk(tweakList) {
  const perTweak = {}
  const allReg = []
  for (const { id, actions } of tweakList || []) {
    const regActions = (actions || []).filter((a) => a.type === 'reg' && a.action !== 'delete')
    perTweak[id] = regActions
    allReg.push(...regActions)
  }

  const unknownAll = () =>
    Object.fromEntries(Object.keys(perTweak).map((id) => [id, 'unknown']))

  if (allReg.length === 0) return unknownAll()

  const { exitCode, result } = await runElevatedScript(getStatusReader(), { actions: allReg })
  if (exitCode !== 0 || !result) return unknownAll()

  const out = {}
  for (const [id, regActions] of Object.entries(perTweak)) {
    if (regActions.length === 0) { out[id] = 'unknown'; continue }
    let matched = 0
    let totalChecked = 0
    for (const a of regActions) {
      const entry = result[`${a.hive}\\${a.path}\\${a.value}`]
      if (!entry) continue
      totalChecked++
      if (entry.present && entry.data === String(a.data)) matched++
    }
    if (totalChecked === 0) out[id] = 'unknown'
    else if (matched === totalChecked) out[id] = 'applied'
    else if (matched === 0) out[id] = 'not_applied'
    else out[id] = 'partial'
  }
  return out
}

module.exports = {
  runTweakElevated,
  previewTweak,
  readTweakStatus,
  readTweakStatusBulk,
  runElevatedScript,
  resolveScriptPath,
  appScriptsDir,
  unpackAsarPath,
  tempDir,
}
