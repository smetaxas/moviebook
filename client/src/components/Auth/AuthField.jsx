import { useState } from 'react'

function AuthField({ label, icon, type = 'text', rightSlot, style, ...rest }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={style}>
      <label style={{ color: '#888', display: 'block', marginBottom: '0.45rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
            color: focused ? '#dc3c4f' : '#666', fontSize: '0.95rem', transition: 'color 0.2s', pointerEvents: 'none'
          }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: `0.75rem ${rightSlot ? '2.75rem' : '0.9rem'} 0.75rem ${icon ? '2.5rem' : '0.9rem'}`,
            borderRadius: '12px',
            border: '1px solid ' + (focused ? '#b31f2f' : 'rgba(255,255,255,0.1)'),
            backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
            boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          {...rest}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthField
