import logoUrl from '../assets/app-icon.png'
import { useT } from '../lib/I18nContext'

export default function Splash({ visible }) {
  const t = useT()
  if (!visible) return null
  return (
    <div className="splash" aria-hidden={!visible}>
      <div className="splash__card">
        <img src={logoUrl} alt="" className="splash__logo" draggable={false} />
        <div className="splash__title">{t('appName')}</div>
        <div className="splash__credit">{t('settingsAboutMadeBy')}</div>
      </div>
    </div>
  )
}
