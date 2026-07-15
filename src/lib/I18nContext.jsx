import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { createT } from './i18n'
import { loadPrefs, savePrefs, applyThemeToDom } from './prefs'

const Ctx = createContext(null)

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => loadPrefs())

  useEffect(() => {
    applyThemeToDom(prefs.theme)
  }, [prefs.theme])

  useEffect(() => {
    if (prefs.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyThemeToDom('system')
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [prefs.theme])

  const setTheme = useCallback((theme) => {
    setPrefs((p) => savePrefs({ ...p, theme }))
  }, [])

  const setLang = useCallback((lang) => {
    setPrefs((p) => savePrefs({ ...p, lang }))
  }, [])

  const setTelemetry = useCallback((telemetry) => {
    setPrefs((p) => savePrefs({ ...p, telemetry: !!telemetry }))
  }, [])

  const setAutoUpdate = useCallback((autoUpdate) => {
    setPrefs((p) => savePrefs({ ...p, autoUpdate: !!autoUpdate }))
  }, [])

  const t = useMemo(() => createT(prefs.lang), [prefs.lang])

  const value = useMemo(
    () => ({
      lang: prefs.lang,
      theme: prefs.theme,
      telemetry: !!prefs.telemetry,
      autoUpdate: prefs.autoUpdate !== false,
      setTheme,
      setLang,
      setTelemetry,
      setAutoUpdate,
      t,
    }),
    [prefs.lang, prefs.theme, prefs.telemetry, prefs.autoUpdate, setTheme, setLang, setTelemetry, setAutoUpdate, t],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePrefs() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePrefs outside PrefsProvider')
  return v
}

export function useT() {
  return usePrefs().t
}
