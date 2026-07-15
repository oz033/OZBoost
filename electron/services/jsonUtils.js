'use strict'

// BOM-tolerant JSON helpers.
//
// PowerShell 5.1's Set-Content -Encoding UTF8 writes a 3-byte BOM
// (EF BB BF) at the start of the file, which makes Node's JSON.parse
// throw 'Unexpected token \uFEFF'. These helpers strip the BOM before
// parsing so we're robust against any PS-written JSON.

const fs = require('fs')

function stripBom(str) {
  if (typeof str !== 'string') return str
  // Remove BOM (U+FEFF) whether it appears as the actual char or as the
  // literal escape that appears after reading bytes EF BB BF as UTF-8.
  if (str.charCodeAt(0) === 0xfeff) return str.slice(1)
  return str
}

function readJsonSync(file) {
  const raw = fs.readFileSync(file, 'utf8')
  return JSON.parse(stripBom(raw))
}

function readJsonAsync(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, raw) => {
      if (err) return reject(err)
      try { resolve(JSON.parse(stripBom(raw))) }
      catch (e) { reject(e) }
    })
  })
}

module.exports = { stripBom, readJsonSync, readJsonAsync }
