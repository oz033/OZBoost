'use strict'

const { app, BrowserWindow, Menu, Tray, ipcMain, shell, nativeImage } = require('electron')
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {
  runTweakElevated,
  previewTweak,
  readTweakStatus,
  readTweakStatusBulk,
  resolveScriptPath,
} = require('./services/powerShell')
const { createRestorePoint, snapshotTweakRegistry, listBackups } = require('./services/backup')
const { loadState, saveTweakState } = require('./services/state')
const { readJsonSync } = require('./services/jsonUtils')
const { logMain, logFilePath } = require('./services/logger')

let mainWindow = null
let tray = null
let updaterReady = false

// ─── Self-Elevation ─────────────────────────────────────────────
// OZBoost braucht Admin für HKLM-Registry/Services. Statt bei JEDEM
// Tweak einen UAC-Prompt zu zeigen, erheben wir uns beim Start EINMAL.
// In dev überspringen wir das (Electron läuft dann in der IDE).
const isDev = !!process.env.VITE_DEV_SERVER_URL

// Elevation ändert sich zur Laufzeit nicht — einmal prüfen, nie wieder
// (execSync ist synchron/blockierend und lief vorher bei jedem IPC-Call).
const IS_ADMIN = (() => {
  try {
    execSync('net session', { stdio: 'ignore', windowsHide: true })
    return true
  } catch {
    return false
  }
})()

if (!isDev && !IS_ADMIN) {
  // Re-launch self elevated via PowerShell Start-Process -Verb RunAs.
  // electron.exe / OZBoost.exe mit den selben Args.
  const exe = process.execPath
  const args = process.argv.slice(1).map((a) => `"${a}"`).join(' ')
  try {
    spawn('powershell.exe', [
      '-NoProfile', '-WindowStyle', 'Hidden', '-Command',
      `Start-Process '${exe.replace(/'/g, "''")}' -Verb RunAs -ArgumentList '${args.replace(/'/g, "''")}'`,
    ], { windowsHide: true, detached: true, stdio: 'ignore' }).unref()
  } catch {
    // Fallback: continue without admin — tweaks will prompt per-action.
  }
  app.quit()
}

// ─── Zentrale Fehlerbehandlung im Main-Prozess ──────────────────
// Kein unhandled Crash: loggen und weiterlaufen (Fenster bleibt bedienbar).
process.on('uncaughtException', (err) => {
  logMain('error', `uncaughtException: ${err.stack || err.message}`)
})
process.on('unhandledRejection', (reason) => {
  logMain('error', `unhandledRejection: ${reason instanceof Error ? reason.stack : String(reason)}`)
})

// Prevent multiple instances — second focus()s the first.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })
}

function resolveAppIcon() {
  // Packaged: extraResources/icon.ico next to app.asar. Dev: build/icon.ico.
  if (app.isPackaged) {
    const packaged = path.join(process.resourcesPath, 'icon.ico')
    if (require('fs').existsSync(packaged)) return packaged
  }
  const devIco = path.join(__dirname, '..', 'build', 'icon.ico')
  const devPng = path.join(__dirname, '..', 'build', 'icon.png')
  if (require('fs').existsSync(devIco)) return devIco
  if (require('fs').existsSync(devPng)) return devPng
  return undefined
}

function getMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

function showMainWindow() {
  const win = getMainWindow()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function sendTrayAction(action) {
  const win = getMainWindow()
  if (!win) return
  showMainWindow()
  win.webContents.send('tray:action', action)
}

function createTray() {
  if (tray) return
  const iconPath = resolveAppIcon()
  let image = iconPath ? nativeImage.createFromPath(iconPath) : null
  if (image && !image.isEmpty()) {
    image = image.resize({ width: 16, height: 16 })
  } else {
    image = nativeImage.createEmpty()
  }
  tray = new Tray(image)
  tray.setToolTip('OZBoost')
  const menu = Menu.buildFromTemplate([
    { label: 'OZBoost anzeigen', click: () => sendTrayAction('show') },
    { type: 'separator' },
    { label: 'Safe Boost…', click: () => sendTrayAction('safe-boost') },
    { label: 'Cleaner öffnen', click: () => sendTrayAction('quick-clean') },
    { type: 'separator' },
    { label: 'Beenden', click: () => { app.isQuiting = true; app.quit() } },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => sendTrayAction('show'))
}

function setupAutoUpdater() {
  if (isDev || !app.isPackaged) return
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoDownload = false
    autoUpdater.logger = {
      info: (m) => logMain('info', `[update] ${m}`),
      warn: (m) => logMain('warn', `[update] ${m}`),
      error: (m) => logMain('error', `[update] ${m}`),
    }
    autoUpdater.on('error', (err) => {
      logMain('warn', `[update] ${err.message}`)
    })
    updaterReady = true
  } catch (err) {
    logMain('warn', `[update] electron-updater not available: ${err.message}`)
  }
}

function titleBarOverlayFor(theme) {
  // Native Windows caption buttons must match light/dark app chrome.
  if (theme === 'light') {
    return { color: '#ebebef', symbolColor: '#3a3a3c', height: 40 }
  }
  return { color: '#121214', symbolColor: '#f5f5f7', height: 40 }
}

function applyWindowChrome(theme) {
  const win = getMainWindow()
  if (!win || win.isDestroyed()) return
  const overlay = titleBarOverlayFor(theme)
  try {
    win.setTitleBarOverlay(overlay)
  } catch (err) {
    logMain('warn', `[chrome] setTitleBarOverlay: ${err.message}`)
  }
  try {
    win.setBackgroundColor(theme === 'light' ? '#e5e5ea' : '#0c0c0e')
  } catch { /* ignore */ }
}

function createWindow() {
  const iconPath = resolveAppIcon()
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0c0e',
    title: 'OZBoost',
    ...(iconPath ? { icon: iconPath } : {}),
    autoHideMenuBar: true,
    // Moderne Titlebar: eigene Drag-Region im Renderer, native
    // Fenster-Buttons als Overlay (Snap-Layouts bleiben erhalten).
    titleBarStyle: 'hidden',
    titleBarOverlay: titleBarOverlayFor('dark'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  mainWindow = win

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'))
    if (process.env.OZB_DEBUG) win.webContents.openDevTools({ mode: 'detach' })
  }

  // Hide to tray instead of quitting on close (Windows).
  win.on('close', (e) => {
    if (!app.isQuiting && process.platform === 'win32') {
      e.preventDefault()
      win.hide()
    }
  })

  // Renderer-Fehler landen im zentralen Logfile.
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) logMain('error', `[renderer] ${message} (${sourceId}:${line})`)
  })
  win.webContents.on('render-process-gone', (event, details) => {
    logMain('error', `[crash] reason=${details.reason} exitCode=${details.exitCode}`)
  })
  win.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    logMain('error', `[load-fail] ${errorCode}: ${errorDesc}`)
  })
}

// ─── IPC-Input-Validierung ──────────────────────────────────────
// Der Renderer ist sandboxed, aber Defense-in-Depth: alles was in
// PowerShell/Registry landet, wird hier auf Form geprüft.

const VALID_ACTION_TYPES = new Set([
  'reg', 'cmd', 'service', 'powercfg', 'appx', 'task', 'file',
  'reg_file', 'net_binding', 'open', 'sc', 'msi', 'ps_module',
])

function validateTweakRun({ tweakId, action, actions }) {
  if (typeof tweakId !== 'string' || !/^[a-z0-9_]+$/i.test(tweakId)) return 'invalid tweakId'
  if (action !== 'apply' && action !== 'revert') return 'invalid action'
  if (!Array.isArray(actions)) return 'actions must be an array'
  for (const a of actions) {
    if (!a || typeof a !== 'object' || !VALID_ACTION_TYPES.has(a.type)) {
      return `unknown action type: ${a && a.type}`
    }
  }
  return null
}

// ─── PS-Script-Runner (Cleaner, Analyse, Ping, Startup) ─────────
// Space-safe: never rely on -File with fragile ArgumentList joining.
// We invoke via -Command & 'script.ps1' -ResultFile 'out.json' so paths
// with spaces (e.g. "D:\arbeit\zcode project\...") work.
function psSingleQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

function runPsScript(scriptName, extraArgs = []) {
  const scriptPath = resolveScriptPath(scriptName)
  const dir = path.join(os.tmpdir(), 'ozboost')
  fs.mkdirSync(dir, { recursive: true })
  const resultFile = path.join(
    dir,
    `${path.parse(scriptName).name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.json`,
  )

  if (!scriptPath || !fs.existsSync(scriptPath)) {
    const msg = `Script nicht gefunden: ${scriptName} (resolved=${scriptPath || 'null'})`
    logMain('error', `[ps] ${msg}`)
    return Promise.resolve({ error: msg })
  }

  // extraArgs: ['-Mode','scan','-Areas','all'] → -Mode 'scan' -Areas 'all'
  let argStr = ''
  for (let i = 0; i < extraArgs.length; i++) {
    const a = String(extraArgs[i])
    if (a.startsWith('-')) {
      argStr += ` ${a}`
    } else {
      argStr += ` ${psSingleQuote(a)}`
    }
  }
  const command =
    `& ${psSingleQuote(scriptPath)}${argStr} -ResultFile ${psSingleQuote(resultFile)}; ` +
    `if (-not (Test-Path -LiteralPath ${psSingleQuote(resultFile)})) { ` +
    `  $err = @{ error = 'Script wrote no result file'; script = ${psSingleQuote(scriptName)}; exitCode = $LASTEXITCODE } | ConvertTo-Json -Compress; ` +
    `  [IO.File]::WriteAllText(${psSingleQuote(resultFile)}, $err, [Text.UTF8Encoding]::new($false)) ` +
    `}`

  logMain('info', `[ps] run ${scriptName} admin=${IS_ADMIN}`)

  return new Promise((resolve) => {
    let stderr = ''
    let child
    if (IS_ADMIN) {
      child = spawn(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo', '-Command', command],
        { windowsHide: true },
      )
    } else {
      // Non-admin: one UAC prompt. Pass the whole -Command as a single-quoted arg
      // (paths inside are already single-quoted with '' escaping).
      child = spawn('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoLogo',
        '-Command',
        `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList ` +
          `'-NoProfile','-ExecutionPolicy','Bypass','-NoLogo','-Command',${psSingleQuote(command)}`,
      ], { windowsHide: true })
    }
    if (child.stderr) child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('error', (err) => {
      logMain('error', `[ps] ${scriptName} spawn failed: ${err.message}`)
      resolve({ error: err.message })
    })
    child.on('close', (code) => {
      try {
        const data = readJsonSync(resultFile)
        if (data && data.error) {
          logMain('warn', `[ps] ${scriptName} reported error: ${data.error}`)
        }
        resolve(data)
      } catch (err) {
        const detail = (stderr || err.message || '').trim().split(/\r?\n/)[0] || err.message
        logMain('error', `[ps] ${scriptName} no result (exit=${code}): ${detail}`)
        resolve({
          error: `${scriptName} fehlgeschlagen: ${detail}`,
          exitCode: code,
          scriptPath,
        })
      } finally {
        try { fs.unlinkSync(resultFile) } catch { /* schon weg */ }
      }
    })
  })
}

// ---------- IPC: renderer → main ----------

// Stream stdout lines from the elevated PS process back to the renderer.
// onLog receives each line; resolves with { exitCode, elevated } on completion.
ipcMain.handle('tweak:run', async (event, payload) => {
  const invalid = validateTweakRun(payload || {})
  if (invalid) {
    logMain('warn', `[ipc] tweak:run rejected: ${invalid}`)
    return { exitCode: 1, error: invalid }
  }
  const { tweakId, action, actions } = payload

  const win = BrowserWindow.fromWebContents(event.sender)
  const onLog = (line) => {
    if (win && !win.isDestroyed()) event.sender.send('tweak:log', { tweakId, line })
  }
  // The elevated PS can't open browsers/settings pages (admin session is
  // detached from the user desktop). When it emits <OZB:OPEN> markers we
  // open them here from the non-elevated main process instead.
  const onOpen = (target) => {
    try {
      if (/^https?:\/\//i.test(target) || /^ms-settings:/i.test(target) || /^[a-z]+:\/\//i.test(target)) {
        shell.openExternal(target)
      } else {
        shell.openPath(target)
      }
      onLog(`[open] ${target}`)
    } catch (err) {
      onLog(`[warn] open failed: ${err.message}`)
    }
  }

  logMain('info', `[tweak] ${action} ${tweakId} (${actions.length} actions)`)
  try {
    // Granular registry snapshot BEFORE applying — enables precise per-tweak
    // revert later (in addition to the coarse System Restore Point).
    if (action === 'apply') {
      await snapshotTweakRegistry(tweakId, actions)
    }
    const result = await runTweakElevated({ tweakId, action, actions, onLog, onOpen })
    if (result.exitCode === 0) {
      await saveTweakState(tweakId, action === 'apply' ? 'applied' : 'reverted')
    } else {
      logMain('warn', `[tweak] ${tweakId} exit=${result.exitCode} ${result.error || ''}`)
    }
    return result
  } catch (err) {
    logMain('error', `[tweak] ${tweakId} threw: ${err.stack || err.message}`)
    return { exitCode: 1, elevated: false, error: err.message }
  }
})

// Dry-run: describe each action without touching the system.
ipcMain.handle('tweak:preview', async (event, { action, actions }) => {
  return previewTweak(action, Array.isArray(actions) ? actions : [])
})

// Live status check: compare a tweak's apply-actions against the live registry.
ipcMain.handle('tweak:status', async (event, { actions }) => {
  try {
    return await readTweakStatus(actions)
  } catch {
    return 'unknown'
  }
})

// Bulk status check: ONE PS call for all tweaks. [{ id, actions }] → { id: status }.
ipcMain.handle('tweak:statusAll', async (event, { tweaks }) => {
  try {
    return await readTweakStatusBulk(Array.isArray(tweaks) ? tweaks : [])
  } catch (err) {
    logMain('warn', `[status] bulk failed: ${err.message}`)
    return {}
  }
})

ipcMain.handle('backup:create', async (event, { label }) => {
  const onLog = (line) => event.sender.send('tweak:log', { tweakId: 'backup', line })
  const safeLabel = String(label || 'OZBoost manual').replace(/["`$]/g, '').slice(0, 60)
  logMain('info', `[backup] create "${safeLabel}"`)
  return createRestorePoint(safeLabel, onLog)
})

ipcMain.handle('backup:list', async () => listBackups())

// System Cleaner: scannt Cache-Bereiche / bereinigt Auswahl.
ipcMain.handle('cleaner:scan', async () => runPsScript('systemCleaner.ps1', ['-Mode', 'scan', '-Areas', 'all']))

ipcMain.handle('cleaner:clean', async (event, { areas }) => {
  // Nur bekannte Area-Slugs durchlassen (landen als -Areas String im PS-Aufruf).
  const clean = (Array.isArray(areas) ? areas : []).filter((a) => /^[a-z0-9_]+$/i.test(a))
  const areaStr = clean.length > 0 ? clean.join(',') : 'all'
  logMain('info', `[cleaner] clean ${areaStr}`)
  return runPsScript('systemCleaner.ps1', ['-Mode', 'clean', '-Areas', areaStr])
})

// System-Analyse: CPU/GPU/RAM/Settings als JSON.
ipcMain.handle('system:analyze', async () => runPsScript('systemAnalysis.ps1'))

// Network ping (info only).
ipcMain.handle('network:ping', async (_e, { target, count } = {}) => {
  const t = String(target || '1.1.1.1').replace(/[^\w.\-:]/g, '').slice(0, 64) || '1.1.1.1'
  const n = Math.min(10, Math.max(1, Number(count) || 4))
  return runPsScript('networkPing.ps1', ['-Target', t, '-Count', String(n)])
})

// Startup apps (HKCU Run only — list / disable / enable).
ipcMain.handle('startup:list', async () => runPsScript('startupApps.ps1', ['-Mode', 'list']))

ipcMain.handle('startup:set', async (event, { name, enabled }) => {
  const safe = String(name || '').replace(/["`$]/g, '').slice(0, 120)
  if (!safe) return { ok: false, error: 'invalid name' }
  const mode = enabled ? 'enable' : 'disable'
  logMain('info', `[startup] ${mode} ${safe}`)
  return runPsScript('startupApps.ps1', ['-Mode', mode, '-EntryName', safe])
})

// Selective bloatware removal: receives an app list from the renderer and
// delegates to scripts/modules/RemoveApps.ps1.
ipcMain.handle('bloatware:remove', async (event, { apps }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const onLog = (line) => {
    if (win && !win.isDestroyed()) event.sender.send('tweak:log', { tweakId: 'bloatware', line })
  }
  return runTweakElevated({
    tweakId: 'bloatware_' + Date.now(),
    action: 'apply',
    actions: [{ type: 'ps_module', module: 'RemoveApps', args: { apps } }],
    onLog,
  })
})

ipcMain.handle('state:load', async () => loadState())

// Natives Kontextmenü: Renderer schickt Items, Main zeigt das OS-Menü und
// gibt die geklickte Item-ID zurück (null bei Abbruch). Nur Strings rein —
// keine Callbacks über IPC.
ipcMain.handle('menu:context', async (event, { items }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win || !Array.isArray(items)) return null
  return new Promise((resolve) => {
    let resolved = false
    const done = (id) => {
      if (!resolved) {
        resolved = true
        resolve(id)
      }
    }
    const template = items.slice(0, 20).map((it) =>
      it.type === 'separator'
        ? { type: 'separator' }
        : {
            label: String(it.label || '').slice(0, 80),
            enabled: it.enabled !== false,
            click: () => done(String(it.id)),
          },
    )
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: win, callback: () => setTimeout(() => done(null), 50) })
  })
})

// Renderer-Log-Einträge in die zentrale Logdatei übernehmen (fire-and-forget).
ipcMain.on('log:write', (event, { level, text }) => {
  if (typeof text === 'string' && text.length <= 2000) {
    logMain(typeof level === 'string' ? level : 'info', `[app] ${text}`)
  }
})

ipcMain.handle('log:path', async () => logFilePath())

ipcMain.handle('app:version', async () => app.getVersion())

// Sync native titlebar caption buttons with renderer light/dark theme.
ipcMain.handle('window:setThemeChrome', async (_e, theme) => {
  const t = theme === 'light' ? 'light' : 'dark'
  applyWindowChrome(t)
  return { ok: true, theme: t }
})

ipcMain.handle('shell:openExternal', async (_e, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return { ok: false }
  await shell.openExternal(url)
  return { ok: true }
})

ipcMain.handle('update:check', async () => {
  if (isDev || !app.isPackaged) {
    return { updateAvailable: false, version: app.getVersion(), error: 'dev' }
  }
  if (!updaterReady) {
    return { updateAvailable: false, version: app.getVersion(), error: 'no-updater' }
  }
  try {
    const { autoUpdater } = require('electron-updater')
    const result = await autoUpdater.checkForUpdates()
    const info = result?.updateInfo
    const remote = info?.version
    const available = !!(remote && remote !== app.getVersion())
    return {
      updateAvailable: available,
      version: remote || app.getVersion(),
      current: app.getVersion(),
    }
  } catch (err) {
    logMain('warn', `[update] check failed: ${err.message}`)
    return { updateAvailable: false, version: app.getVersion(), error: err.message }
  }
})

ipcMain.handle('update:download', async () => {
  if (isDev || !app.isPackaged || !updaterReady) return { ok: false }
  try {
    const { autoUpdater } = require('electron-updater')
    await autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall(false, true)
    return { ok: true }
  } catch (err) {
    logMain('warn', `[update] download failed: ${err.message}`)
    return { ok: false, error: err.message }
  }
})

// Windows groups taskbar icons by AppUserModelID — set explicitly so our icon sticks.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.oz033.ozboost')
}

app.whenReady().then(() => {
  logMain('info', `OZBoost start — admin=${IS_ADMIN} dev=${isDev} v=${app.getVersion()}`)
  createWindow()
  createTray()
  setupAutoUpdater()
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows.
  if (process.platform !== 'darwin' && app.isQuiting) app.quit()
})

app.on('before-quit', () => {
  app.isQuiting = true
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else showMainWindow()
})
