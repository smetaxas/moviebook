import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import useIsMobile from '../../hooks/useIsMobile'

const menuStyles = `
  .pm-item { -webkit-tap-highlight-color: transparent; transition: background-color 0.15s; }
  .pm-item:active { background-color: rgba(255,255,255,0.08) !important; }
  @media (hover: hover) {
    .pm-item:hover { background-color: rgba(255,255,255,0.06) !important; transform: none; filter: none; }
    .pm-item.danger:hover { background-color: rgba(179,31,47,0.14) !important; }
  }
`

const svg = (children) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const ICONS = {
  logout: svg(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4" /><line x1="6" y1="12" x2="15" y2="12" /></>),
  account: svg(<><circle cx="12" cy="8.5" r="3.8" /><path d="M5 20c1.1-3.6 3.8-5.5 7-5.5s5.9 1.9 7 5.5" /><circle cx="18.5" cy="5.5" r="2.2" /></>),
  chevron: svg(<path d="M9 6l6 6-6 6" />),
}

const MenuItem = ({ onClick, icon, label, hint, right, danger }) => (
  <button
    type="button"
    className={'pm-item' + (danger ? ' danger' : '')}
    onClick={onClick}
    style={{
      width: '100%', minHeight: '48px', padding: '0.5rem 0.6rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      backgroundColor: 'transparent', border: 'none', borderRadius: '11px', cursor: 'pointer', textAlign: 'left'
    }}
  >
    <span style={{
      flexShrink: 0, width: '34px', height: '34px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#ff6b7d' : '#ddd',
      backgroundColor: danger ? 'rgba(179,31,47,0.14)' : 'rgba(255,255,255,0.06)',
      border: '1px solid ' + (danger ? 'rgba(220,60,79,0.3)' : 'rgba(255,255,255,0.08)')
    }}>{icon}</span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', color: danger ? '#ff6b7d' : 'white', fontSize: '0.88rem', fontWeight: 700 }}>{label}</span>
      {hint && <span style={{ display: 'block', color: '#888', fontSize: '0.72rem', marginTop: '0.1rem' }}>{hint}</span>}
    </span>
    {right}
  </button>
)

function ProfileMenu({ user, onLogout }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [triggerHover, setTriggerHover] = useState(false)
  // On mobile the navbar has no room for the expanding username + chevron —
  // the trigger is just the avatar (name and email are in the dropdown).
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setTriggerHover(true)}
        onMouseLeave={() => setTriggerHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
          padding: isMobile ? '2px' : '0.3rem 0.75rem 0.3rem 0.3rem', borderRadius: '999px',
          border: '1px solid ' + (triggerHover || open ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'),
          backgroundColor: triggerHover || open ? 'rgba(255,255,255,0.08)' : 'transparent',
          transition: 'background-color 0.15s, border-color 0.15s'
        }}
      >
        <Avatar user={user} size={isMobile ? 34 : 32} onClick={() => setOpen(!open)} />
        {!isMobile && (<>
        {/* Grid-template-columns animates 0fr->1fr, which — unlike width — can
            transition smoothly to/from an intrinsic ("auto") size. Anchored to
            the trigger's right edge, growing this reveals the username by
            expanding the whole pill leftward. */}
        <div style={{
          display: 'grid', gridTemplateColumns: open ? '1fr' : '0fr',
          transition: 'grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{
            overflow: 'hidden', whiteSpace: 'nowrap', color: 'white', fontWeight: 600, fontSize: '0.85rem',
            opacity: open ? 1 : 0, transition: 'opacity 0.18s ease ' + (open ? '0.08s' : '0s')
          }}>
            {user.username}
          </span>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          width: '20px', height: '20px', borderRadius: '50%',
          backgroundColor: triggerHover || open ? 'rgba(255,255,255,0.12)' : 'transparent',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s'
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke={open ? 'white' : '#ccc'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        </>)}
      </div>

      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
          pointerEvents: open ? 'auto' : 'none'
        }}
      />

      <div role="menu" style={{
        position: 'absolute', right: 0, top: 'calc(100% + 0.6rem)', overflow: 'hidden',
        width: isMobile ? 'min(290px, calc(100vw - 1.5rem))' : '280px', boxSizing: 'border-box',
        background: 'linear-gradient(160deg, #1d1d1d 0%, #131313 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '0.45rem',
        zIndex: 201, boxShadow: '0 18px 44px rgba(0,0,0,0.6)',
        transformOrigin: 'top right',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <style>{menuStyles}</style>

        {/* Who's signed in */}
        <div style={{
          position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 0.8rem', marginBottom: '0.35rem', borderRadius: '13px',
          background: 'linear-gradient(135deg, rgba(179,31,47,0.16) 0%, rgba(255,255,255,0.03) 70%)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-50px', left: '-40px', width: '140px', height: '140px',
            background: 'radial-gradient(circle, rgba(179,31,47,0.3) 0%, transparent 70%)', pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative', flexShrink: 0, borderRadius: '50%', boxShadow: '0 4px 14px rgba(179,31,47,0.35)' }}>
            <Avatar user={user} size={46} />
          </div>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</p>
          </div>
        </div>

        <MenuItem
          onClick={() => { setOpen(false); navigate('/account') }}
          icon={ICONS.account}
          label="My account"
          hint="Details, password, privacy, 2FA"
          right={<span style={{ display: 'flex', color: '#666' }}>{ICONS.chevron}</span>}
        />
        <MenuItem onClick={() => { onLogout(); setOpen(false) }} icon={ICONS.logout} label="Log out" />

      </div>
    </div>
  )
}

export default ProfileMenu
