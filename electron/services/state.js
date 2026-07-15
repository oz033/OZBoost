'use strict'

const { readJsonSync } = require('./jsonUtils')

// Tweak state persistence.
//
// Stored as a single JSON file in the app's userData directory:
//   { "<tweakId>": { "status": "applied"|"reverted"|"unknown", "ts": 1234567890 } }
//
// "unknown" is the honest default — we cannot reliably detect whether a tweak is
// currently applied just from the filesystem, so we track our own apply/revert
// history rather than pretending to read the system state.

const fs = require('fs')
const path = require('path')
const { app } = require('electron')

function stateFile() {
  return path.join(app.getPath('userData'), 'ozboost-state.json')
}

function loadState() {
  try {
    return readJsonSync(stateFile())
  } catch {
    return {}
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2), 'utf8')
  } catch (err) {
    console.error('[state] failed to save:', err)
  }
}

function saveTweakState(tweakId, status) {
  const state = loadState()
  state[tweakId] = { status, ts: Date.now() }
  saveState(state)
  return state[tweakId]
}

function getTweakState(tweakId) {
  const state = loadState()
  return state[tweakId] || { status: 'unknown', ts: 0 }
}

function getAppliedCount() {
  const state = loadState()
  return Object.values(state).filter((s) => s.status === 'applied').length
}

module.exports = { loadState, saveTweakState, getTweakState, getAppliedCount }
