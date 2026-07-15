import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyThemeToDom, loadPrefs } from './lib/prefs'
import './styles/global.css'

// Theme before first paint to avoid flash.
applyThemeToDom(loadPrefs().theme)

// Globaler Error-Boundary: fängt Renderer-Crashes ab und zeigt sie sichtbar,
// statt dass das Fenster einfach weiß/leer bleibt.
window.addEventListener('error', (e) => {
  window.api?.writeLog?.('error', `window.onerror: ${e.message} (${e.filename}:${e.lineno})`)
  const errDiv = document.getElementById('ozb-error')
  if (errDiv) {
    errDiv.innerHTML += `<div style="color:#f25555;padding:8px 0;font-family:monospace;font-size:12px;">${e.message} (${e.filename}:${e.lineno})</div>`
    errDiv.style.display = 'block'
  }
})

window.addEventListener('unhandledrejection', (e) => {
  window.api?.writeLog?.('error', `unhandledrejection: ${e.reason}`)
  const errDiv = document.getElementById('ozb-error')
  if (errDiv) {
    errDiv.innerHTML += `<div style="color:#f0a030;padding:4px 0;font-family:monospace;font-size:12px;">[Promise] ${e.reason}</div>`
    errDiv.style.display = 'block'
  }
})

try {
  const root = createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (err) {
  // Wenn React selbst nicht mal rendern kann → zeige den Fehler direkt.
  document.getElementById('root').innerHTML =
    `<div style="padding:40px;color:#f25555;font-family:monospace;font-size:14px;">` +
    `<h2>OZBoost Renderer Error</h2><pre>${err.stack || err.message}</pre>` +
    `<div style="margin-top:20px;color:#888;">window.api verfügbar: ${typeof window.api}</div>` +
    `</div>`
}
