import { useState } from 'react'

const CHEVRON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8a8a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`

// Shared styled <select>: custom chevron, focus glow, matches the app's
// other form controls. `options` is [{ value, label }]; pass `placeholder`
// for a leading empty/"Any" option.
function Select({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '0.5rem 1.8rem 0.5rem 0.7rem',
        borderRadius: '10px',
        backgroundColor: '#1a1a1a',
        border: '1px solid ' + (focused ? '#b31f2f' : 'rgba(255,255,255,0.12)'),
        boxShadow: focused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
        color: 'white', fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        backgroundImage: `url("${CHEVRON}")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center', backgroundSize: '10px',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
    >
      {placeholder !== undefined && (
        <option value="" style={{ backgroundColor: '#1a1a1a' }}>{placeholder}</option>
      )}
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a' }}>{opt.label}</option>
      ))}
    </select>
  )
}

export default Select
