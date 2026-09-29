import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useIsMobile from '../../hooks/useIsMobile'
import NavButton from './NavButton'

// actions: [{ key, label, icon, variant, onClick }] — rendered as NavButtons
// on desktop. On mobile, where a row of pills wouldn't fit, the primary
// ('solid') actions stay one tap away as icon buttons and the rest collapse
// into a ☰ dropdown. children are always rendered as-is (e.g. ProfileMenu).
// leading: rendered before the logo (e.g. a drawer toggle on mobile).
function Navbar({ leading, leftExtra, actions, children }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [menuToggled, setMenuToggled] = useState(false)
  // Widening to desktop and back shouldn't resurrect a menu left open.
  const menuOpen = isMobile && menuToggled

  const primaryActions = isMobile ? (actions || []).filter(a => a.variant === 'solid') : []
  const menuActions = isMobile ? (actions || []).filter(a => a.variant !== 'solid') : []

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e) => e.key === 'Escape' && setMenuToggled(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(179,31,47,0.3)',
      padding: isMobile ? '0 1rem' : '0 2rem', height: 'var(--nav-h)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative', gap: isMobile ? '0.6rem' : '0.5rem', minWidth: 0 }}>
        {leading}
        <img
          src="/logo.png" alt="CineLog"
          onClick={() => navigate('/profile')}
          style={{ height: isMobile ? '42px' : '60px', objectFit: 'contain', cursor: 'pointer', flexShrink: 0 }}
        />
        {leftExtra}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
        {primaryActions.map(action => (
          <button
            key={action.key}
            onClick={action.onClick}
            aria-label={action.label}
            title={action.label}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              backgroundColor: '#b31f2f', border: 'none', color: 'white',
              boxShadow: '0 2px 8px rgba(179,31,47,0.35)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
            }}
          >
            <span style={{ display: 'flex', transform: 'scale(1.15)' }}>{action.icon}</span>
          </button>
        ))}
        {actions?.length > 0 && (isMobile ? (menuActions.length > 0 &&
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuToggled(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                backgroundColor: menuOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '1.3rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s'
              }}
            >
              ☰
            </button>

            {/* Click-outside-to-close backdrop, same pattern as ProfileMenu */}
            <div
              onClick={() => setMenuToggled(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: menuOpen ? 'auto' : 'none' }}
            />

            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 0.6rem)', overflow: 'hidden',
              background: 'linear-gradient(160deg, #1e1e1e 0%, #141414 100%)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0.5rem', minWidth: '180px',
              zIndex: 201, boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
              transformOrigin: 'top right',
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex', flexDirection: 'column', gap: '0.2rem'
            }}>
              {menuActions.map(action => (
                <button
                  key={action.key}
                  onClick={() => { action.onClick(); setMenuToggled(false) }}
                  style={{
                    width: '100%', minHeight: '44px', padding: '0.65rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    backgroundColor: 'transparent', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                    fontSize: '0.88rem', fontWeight: 600
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          actions.map(action => (
            <NavButton key={action.key} variant={action.variant} onClick={action.onClick} icon={action.icon}>
              {action.label}
            </NavButton>
          ))
        ))}
        {children}
      </div>
    </div>
  )
}

export default Navbar
