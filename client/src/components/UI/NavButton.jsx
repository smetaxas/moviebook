import { useState } from 'react'

// variant 'solid' = primary red pill (e.g. Search), 'ghost' = translucent secondary action
function NavButton({ onClick, icon, children, variant = 'ghost', active = false }) {
  const [hover, setHover] = useState(false)
  const solid = variant === 'solid'

  const backgroundColor = solid
    ? (hover ? '#dc3c4f' : '#b31f2f')
    : (active ? 'rgba(179,31,47,0.16)' : hover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)')

  const border = solid
    ? 'none'
    : '1px solid ' + (active ? 'rgba(179,31,47,0.5)' : hover ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)')

  const color = solid ? 'white' : (active ? '#dc3c4f' : 'white')

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: icon ? '0.55rem 1.35rem 0.55rem 1.1rem' : '0.55rem 1.25rem',
        backgroundColor, color, border,
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
        boxShadow: solid ? (hover ? '0 6px 16px rgba(179,31,47,0.45)' : '0 2px 6px rgba(179,31,47,0.2)') : 'none',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s'
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export default NavButton
