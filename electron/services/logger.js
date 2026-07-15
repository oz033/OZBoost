'use strict'

// Zentrales Datei-Logging für den Main-Prozess.
//
// Eine Logdatei pro Tag unter <userData>/logs/ozboost-YYYY-MM-DD.log,
// Format: "2026-07-14 20:31:05 [error] message". Schreibfehler dürfen die
// App nie beeinträchtigen — Logging ist best-effort.
//
// Bewusst ohne externe Dependency (electron-log etc.): die App hat genau
// einen Prozess, der schreibt, und Rotation-per-Tag reicht.

const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const MAX_LOG_FILES = 14

function logsDir() {
  const d = path.join(app.getPath('userData'), 'logs')
  fs.mkdirSync(d, { recursive: true })
  return d
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

function logFilePath() {
  return path.join(logsDir(), `ozboost-${todayStamp()}.log`)
}

let cleanedUp = false

// Alte Logdateien beim ersten Schreiben des Tages entsorgen.
function cleanupOldLogs() {
  if (cleanedUp) return
  cleanedUp = true
  try {
    const dir = logsDir()
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('ozboost-') && f.endsWith('.log')).sort()
    for (const f of files.slice(0, Math.max(0, files.length - MAX_LOG_FILES))) {
      fs.unlinkSync(path.join(dir, f))
    }
  } catch { /* best effort */ }
}

function logMain(level, message) {
  const line = `${new Date().toISOString().replace('T', ' ').slice(0, 19)} [${level}] ${message}\n`
  try {
    cleanupOldLogs()
    fs.appendFileSync(logFilePath(), line, 'utf8')
  } catch { /* Logging darf nie werfen */ }
  // In dev zusätzlich aufs Terminal.
  if (process.env.VITE_DEV_SERVER_URL) {
    console[level === 'error' ? 'error' : 'log'](line.trimEnd())
  }
}

module.exports = { logMain, logFilePath }
