import { useT } from '../lib/I18nContext'
import Icon from '../components/Icons'
import TweakCard from '../components/TweakCard'
import SystemInsights from '../components/SystemInsights'

export default function Tools({
  expertTweaks,
  state,
  liveStatus,
  onToggle,
  onPreview,
  onOpenBloatware,
  onOpenCleaner,
  analysis,
  running,
}) {
  const t = useT()
  const count = expertTweaks?.length || 0
  const active = (expertTweaks || []).filter(
    (tw) => state[tw.id]?.status === 'applied' || liveStatus[tw.id] === 'applied',
  ).length

  return (
    <div className="tools">
      <header className="tools-head">
        <div className="tools-head__copy">
          <h1 className="tools-head__title">{t('toolsTitle')}</h1>
          <p className="tools-head__sub">{t('toolsSub')}</p>
        </div>
        <div className="tools-head__meta" aria-live="polite">
          <span className="tools-head__stat">
            <span className="tools-head__stat-v">{active}</span>
            <span className="tools-head__stat-k">{t('toolsActive')}</span>
          </span>
          <span className="tools-head__sep" aria-hidden>/</span>
          <span className="tools-head__stat">
            <span className="tools-head__stat-v">{count}</span>
            <span className="tools-head__stat-k">{t('toolsTotal')}</span>
          </span>
        </div>
      </header>

      <SystemInsights analysis={analysis} onOpenCleaner={onOpenCleaner} />

      <section className="tools-actions" aria-label={t('toolsBloatware')}>
        <button
          type="button"
          className="tools-action"
          onClick={onOpenBloatware}
          disabled={!!running}
        >
          <span className="tools-action__body">
            <span className="tools-action__title">{t('toolsBloatware')}</span>
            <span className="tools-action__desc">{t('toolsBloatwareDesc')}</span>
          </span>
          <span className="tools-action__cta">
            {t('toolsOpenBloatware')}
            <Icon name="chevron" size={14} />
          </span>
        </button>
      </section>

      <section className="tools-expert">
        <div className="tools-expert__head">
          <h2 className="tools-expert__title">{t('toolsExpert')}</h2>
          <p className="tools-expert__hint">{t('toolsExpertDesc')}</p>
        </div>

        {count === 0 ? (
          <p className="tools-empty">{t('toolsEmpty')}</p>
        ) : (
          <div className="tools-list" role="list">
            {expertTweaks.map((tw) => (
              <TweakCard
                key={tw.id}
                tweak={tw}
                status={state[tw.id]?.status || 'unknown'}
                liveStatus={liveStatus[tw.id]}
                onToggle={onToggle}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
