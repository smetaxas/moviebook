import { useState, useEffect } from 'react'
import Emoji from './Emoji'
import Avatar from './Avatar'

const MenuItem = ({ onClick, color = 'white', icon, children }) => {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '0.6rem 0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.65rem',
        backgroundColor: hover ? 'rgba(255,255,255,0.07)' : 'transparent',
        color, border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem', fontWeight: 600,
        transform: hover ? 'translateX(2px)' : 'translateX(0)',
        transition: 'background-color 0.15s, transform 0.15s'
      }}
    >
      <span style={{ fontSize: '1rem', width: '1.2rem', textAlign: 'center', flexShrink: 0 }}><Emoji>{icon}</Emoji></span>
      {children}
    </button>
  )
}

function ProfileMenu({ user, onOpen2FA, onLogout, onDeleteAccount }) {
  const [open, setOpen] = useState(false)
  const [triggerHover, setTriggerHover] = useState(false)

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
          padding: '0.3rem 0.75rem 0.3rem 0.3rem', borderRadius: '999px',
          border: '1px solid ' + (triggerHover || open ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'),
          backgroundColor: triggerHover || open ? 'rgba(255,255,255,0.08)' : 'transparent',
          transition: 'background-color 0.15s, border-color 0.15s'
        }}
      >
        <Avatar user={user} size={32} onClick={() => setOpen(!open)} />
        <span style={{
          color: '#aaa', fontSize: '0.75rem', display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'
        }}>▾</span>
      </div>

      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
          pointerEvents: open ? 'auto' : 'none'
        }}
      />

      <div style={{
        position: 'absolute', right: 0, top: 'calc(100% + 0.6rem)', overflow: 'hidden',
        background: 'linear-gradient(160deg, #1e1e1e 0%, #141414 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '0.5rem', minWidth: '220px',
        zIndex: 201, boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        transformOrigin: 'top right',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.95)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          position: 'absolute', top: '-50px', right: '-50px', width: '140px', height: '140px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.2) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.4rem' }}>
          <Avatar user={user} size={38} ringColor="#1a1a1a" />
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</p>
            <p style={{ color: '#888', fontSize: '0.75rem', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
        </div>

        <MenuItem onClick={() => { onOpen2FA(); setOpen(false) }} color={user.two_factor_enabled ? '#00c800' : 'white'} icon={user.two_factor_enabled ? '🔐' : '🔓'}>
          {user.two_factor_enabled ? '2FA On' : 'Enable 2FA'}
        </MenuItem>
        <MenuItem onClick={() => { onLogout(); setOpen(false) }} icon="🚪">
          Logout
        </MenuItem>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
          <MenuItem onClick={() => { onDeleteAccount(); setOpen(false) }} color="#dc3c4f" icon="🗑️">
            Delete Account
          </MenuItem>
        </div>
      </div>
    </div>
  )
}

export default ProfileMenu
