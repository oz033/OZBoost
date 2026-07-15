'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Sichere, explizite API-Oberfläche für den Renderer.
// contextIsolation=true + nodeIntegration=false verhindern direkten Node-Zugriff.
// Jede Methode spiegelt genau einen validierten IPC-Handler in main.js.
contextBridge.exposeInMainWorld('api', {
  // Tweaks ausführen (elevated PS).
  runTweak: ({ tweakId, action, actions }) =>
    ipcRenderer.invoke('tweak:run', { tweakId, action, actions }),

  // Dry-Run Vorschau.
  previewTweak: ({ action, actions }) =>
    ipcRenderer.invoke('tweak:preview', { action, actions }),

  // Live-Status eines einzelnen Tweaks (Registry-Vergleich).
  getTweakStatus: (actions) => ipcRenderer.invoke('tweak:status', { actions }),

  // Bulk-Status: EIN PS-Aufruf für alle Tweaks. [{ id, actions }] → { id: status }.
  getAllStatuses: (tweaks) => ipcRenderer.invoke('tweak:statusAll', { tweaks }),

  // Backup / Restore Point.
  createBackup: (label) => ipcRenderer.invoke('backup:create', { label }),
  listBackups: () => ipcRenderer.invoke('backup:list'),

  // System-Analyse: scannt CPU/GPU/RAM/Settings und gibt JSON zurück.
  analyzeSystem: () => ipcRenderer.invoke('system:analyze'),

  networkPing: (target, count = 4) =>
    ipcRenderer.invoke('network:ping', { target, count }),

  // Startup apps (HKCU Run).
  listStartup: () => ipcRenderer.invoke('startup:list'),
  setStartup: (name, enabled) => ipcRenderer.invoke('startup:set', { name, enabled }),

  // System Cleaner: Scan + Clean.
  scanCleaner: () => ipcRenderer.invoke('cleaner:scan'),
  cleanAreas: (areas) => ipcRenderer.invoke('cleaner:clean', { areas }),

  // Selektive Bloatware-Entfernung.
  removeBloatware: (apps) => ipcRenderer.invoke('bloatware:remove', { apps }),

  // Persisted State laden.
  loadState: () => ipcRenderer.invoke('state:load'),

  // Natives Kontextmenü: items = [{ id, label, enabled? } | { type:'separator' }].
  // Gibt die geklickte Item-ID zurück, null bei Abbruch.
  showContextMenu: (items) => ipcRenderer.invoke('menu:context', { items }),

  // Zentrales Logging: Renderer-Events in die Logdatei schreiben.
  writeLog: (level, text) => ipcRenderer.send('log:write', { level, text }),
  getLogPath: () => ipcRenderer.invoke('log:path'),

  // Live-Log-Stream (Renderer abonniert einmal, filtert nach tweakId).
  onTweakLog: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('tweak:log', handler)
    return () => ipcRenderer.removeListener('tweak:log', handler)
  },

  getAppVersion: () => ipcRenderer.invoke('app:version'),
  setThemeChrome: (theme) => ipcRenderer.invoke('window:setThemeChrome', theme),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),

  onTrayAction: (callback) => {
    const handler = (_event, action) => callback(action)
    ipcRenderer.on('tray:action', handler)
    return () => ipcRenderer.removeListener('tray:action', handler)
  },
})
