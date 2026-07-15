export default function Toggle({ on, disabled, onChange, labelOn, labelOff }) {
  const aria = on
    ? (labelOn || 'On — click to turn off')
    : (labelOff || 'Off — click to turn on')

  return (
    <button
      type="button"
      className={`toggle ${on ? 'toggle--on' : ''} ${disabled ? 'toggle--disabled' : ''}`}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!on)}
      aria-pressed={on}
      aria-label={aria}
    >
      <span className="toggle__thumb" />
    </button>
  )
}
