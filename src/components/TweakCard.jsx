import Toggle from './Toggle'
import Icon from './Icons'
import { benefitLabel } from '../data/benefits'
import { tierOf } from '../data/presets'
import { useT } from '../lib/I18nContext'

const TIER_BADGE = {
  safe:         { labelKey: 'intensitySafe', cls: 'badge--safe' },
  strong:       { labelKey: 'intensityStrong', cls: 'badge--strong' },
  experimental: { labelKey: 'intensityMax', cls: 'badge--exp' },
  extras:       { labelKey: 'tierExtra', cls: 'badge--extra' },
}

export default function TweakCard({ tweak, status, liveStatus, onToggle, onPreview }) {
  const t = useT()
  const applied = status === 'applied' || liveStatus === 'applied'
  const benefit = benefitLabel(tweak.id, tweak)
  const tier = tierOf(tweak.id)
  const tierBadge = TIER_BADGE[tier] || TIER_BADGE.extras
  const hasRevert = (tweak.actions?.revert || []).length > 0

  async function handleContextMenu(e) {
    e.preventDefault()
    const picked = await window.api.showContextMenu([
      { id: 'apply', label: t('ctxApply', { name: benefit.short }), enabled: !applied },
      { id: 'revert', label: t('ctxRevert'), enabled: applied && hasRevert },
      { type: 'separator' },
      { id: 'preview', label: t('ctxPreview') },
    ])
    if (picked === 'apply') onToggle(tweak, 'apply')
    else if (picked === 'revert') onToggle(tweak, 'revert')
    else if (picked === 'preview') onPreview(tweak)
  }

  return (
    <div
      className={`tcard ${applied ? 'tcard--active' : ''}`}
      role="listitem"
      onContextMenu={handleContextMenu}
    >
      <div className="tcard__body">
        <div className="tcard__title-row">
          <span className="tcard__title">{benefit.short}</span>
          <span className={`badge ${tierBadge.cls}`}>{t(tierBadge.labelKey)}</span>
          {tweak.requiresReboot && (
            <span className="badge badge--reboot">{t('reboot')}</span>
          )}
        </div>

        <p className="tcard__desc">{benefit.benefit}</p>

        <div className="tcard__meta">
          <span className={`badge ${applied ? 'badge--active' : 'badge--default'}`}>
            {applied ? t('boostActive') : t('winDefault')}
          </span>
          {benefit.impact > 0 && (
            <span className="badge badge--impact" title={t('impactHint', { n: benefit.impact })}>
              {t('impactLabel', { n: benefit.impact })}
            </span>
          )}
          <button
            type="button"
            className="tcard__preview"
            onClick={() => onPreview(tweak)}
          >
            <Icon name="eye" size={12} />
            {t('preview')}
          </button>
        </div>
      </div>

      <div className="tcard__action">
        <Toggle
          on={applied}
          onChange={(next) => onToggle(tweak, next ? 'apply' : 'revert')}
          labelOn={t('toggleOn')}
          labelOff={t('toggleOff')}
        />
      </div>
    </div>
  )
}
