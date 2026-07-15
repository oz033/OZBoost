import { useEffect, useMemo, useRef, useState } from 'react'
import { TWEAKS } from '../data/tweaks'
import Icon from './Icons'
import { useT } from '../lib/I18nContext'

export default function CommandPalette({ open, onClose, commands }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const allCommands = useMemo(() => {
    const tweakCmds = TWEAKS.map((tweak) => ({
      id: `tweak:${tweak.id}`,
      icon: 'settings',
      label: tweak.title,
      hint: tweak.summary,
      group: t('groupTweaks'),
      run: () => commands.openTweak(tweak),
    }))
    return [...commands.static, ...tweakCmds]
  }, [commands, t])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCommands.slice(0, 12)
    const scored = []
    for (const c of allCommands) {
      const label = c.label.toLowerCase()
      const hint = (c.hint || '').toLowerCase()
      let score = -1
      if (label.startsWith(q)) score = 0
      else if (label.includes(q)) score = 1
      else if (hint.includes(q)) score = 2
      if (score >= 0) scored.push([score, c])
    }
    scored.sort((a, b) => a[0] - b[0])
    return scored.slice(0, 12).map(([, c]) => c)
  }, [query, allCommands])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    listRef.current?.children[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  function runCommand(cmd) {
    onClose()
    cmd.run()
  }

  function handleKey(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && results[cursor]) runCommand(results[cursor])
  }

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette__inputrow">
          <span className="palette__glyph"><Icon name="search" size={16} /></span>
          <input
            ref={inputRef}
            className="palette__input"
            placeholder={t('paletteHint')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
          />
          <kbd className="palette__kbd">{t('esc')}</kbd>
        </div>
        <div className="palette__list" ref={listRef}>
          {results.length === 0 && (
            <div className="palette__empty">{t('paletteEmpty', { q: query })}</div>
          )}
          {results.map((c, i) => (
            <button
              key={c.id}
              className={`palette__item ${i === cursor ? 'palette__item--active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => runCommand(c)}
            >
              <span className="palette__item-icon">
                <Icon name={c.icon || 'settings'} size={14} />
              </span>
              <span className="palette__item-body">
                <span className="palette__item-label">{c.label}</span>
                {c.hint && <span className="palette__item-hint">{c.hint}</span>}
              </span>
              <span className="palette__item-group">{c.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
