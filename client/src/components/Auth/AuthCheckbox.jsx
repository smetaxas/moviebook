function AuthCheckbox({ checked, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' }}
    >
      <span style={{
        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
        border: '1.5px solid ' + (checked ? '#b31f2f' : 'rgba(255,255,255,0.25)'),
        backgroundColor: checked ? '#b31f2f' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.15s, border-color 0.15s'
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{label}</span>
    </div>
  )
}

export default AuthCheckbox
