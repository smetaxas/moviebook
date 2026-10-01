import { useState } from 'react'

// A labelled input with an icon. `status` ('error' | 'ok') tints the border;
// `hint` is a line under it in the same tint.
function AuthField({ label, icon, type = 'text', rightSlot, style, status, hint, labelExtra, ...rest }) {
  const [focused, setFocused] = useState(false)
  const tint = status === 'error' ? '#ff5a6c' : status === 'ok' ? '#4ade80' : null
  const border = focused ? 'rgba(220,60,79,0.8)' : tint ? tint + '99' : 'rgba(255,255,255,0.1)'

  return (
    <div style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem', gap: '0.5rem' }}>
        <label htmlFor={rest.id || rest.name} style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 600 }}>{label}</label>
        {labelExtra}
      </div>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', display: 'flex',
            color: focused ? '#ff5a6c' : '#777', transition: 'color 0.2s', pointerEvents: 'none'
          }}>
            {icon}
          </span>
        )}
        <input
          id={rest.id || rest.name}
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={status === 'error' || undefined}
          style={{
            width: '100%', height: '50px', padding: `0 ${rightSlot ? '2.9rem' : '0.95rem'} 0 ${icon ? '2.7rem' : '0.95rem'}`,
            borderRadius: '13px', border: '1px solid ' + border,
            backgroundColor: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.045)', color: 'white',
            // 16px minimum: anything smaller makes iOS Safari zoom in on focus.
            boxSizing: 'border-box', fontSize: '1rem', outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(179,31,47,0.2)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s'
          }}
          {...rest}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {hint && <p style={{ margin: '0.4rem 0 0 0.1rem', fontSize: '0.76rem', fontWeight: 600, color: tint || '#888' }}>{hint}</p>}
    </div>
  )
}

export default AuthField
