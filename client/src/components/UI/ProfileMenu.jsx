import { useState, useEffect } from 'react'
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
  shield: svg(<><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
  logout: svg(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4" /><line x1="6" y1="12" x2="15" y2="12" /></>),
  trash: svg(<><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /><line x1="10" y1="11" x2="10" y2="16" /><line x1="14" y1="11" x2="14" y2="16" /></>),
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

function ProfileMenu({ user, onOpen2FA, onLogout, onDeleteAccount }) {
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
            <p style={{ color: '#999', fontSize: '0.75rem', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
        </div>

        <MenuItem
          onClick={() => { onOpen2FA(); setOpen(false) }}
          icon={ICONS.shield}
          label="Two-factor auth"
          hint={user.two_factor_enabled ? 'Your account is protected' : 'Extra sign-in security'}
          right={
            <span style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.04em',
              backgroundColor: user.two_factor_enabled ? 'rgba(46,204,113,0.14)' : 'rgba(255,255,255,0.07)',
              color: user.two_factor_enabled ? '#4ade80' : '#aaa',
              border: '1px solid ' + (user.two_factor_enabled ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)')
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: user.two_factor_enabled ? '#4ade80' : '#777' }} />
              {user.two_factor_enabled ? 'ON' : 'OFF'}
            </span>
          }
        />
        <MenuItem onClick={() => { onLogout(); setOpen(false) }} icon={ICONS.logout} label="Log out" />

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '0.35rem 0.4rem' }} />
        <MenuItem danger onClick={() => { onDeleteAccount(); setOpen(false) }} icon={ICONS.trash} label="Delete account" hint="Permanently remove your data" />
      </div>
    </div>
  )
}

export default ProfileMenu
