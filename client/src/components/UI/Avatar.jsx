import { useState } from 'react'

// Shared avatar: shows the user's photo in a gradient ring, or a colored
// initial circle when there's no photo. `ringColor` should match whatever
// background the avatar sits on (page bg vs. a modal panel) so the ring
// border blends in instead of showing a visible seam.
//
// `expandOnClick`: when true and a photo exists, clicking opens a full-size
// lightbox instead of firing `onClick` directly (used where `onClick`
// navigates to that user's profile — the lightbox offers a "View Profile"
// button so that's still one click away). Falls back to `onClick` when
// there's no photo to show, or when `expandOnClick` is off (e.g. the navbar
// avatar, where the click opens the account menu instead).
function Avatar({ user, size = 40, onClick, ringColor = '#0a0a0a', expandOnClick = false }) {
  const [showFull, setShowFull] = useState(false)
  const ringWidth = size >= 60 ? 3 : 2
  const initial = (user?.username || user?.email || '?')[0].toUpperCase()
  const hasPhoto = !!user?.profile_photo
  const canExpand = expandOnClick && hasPhoto

  const handleClick = () => {
    if (canExpand) {
      setShowFull(true)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          cursor: (onClick || canExpand) ? 'pointer' : 'default', flexShrink: 0,
          borderRadius: '50%', padding: `${ringWidth}px`, overflow: 'hidden',
          background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)'
        }}
      >
        {hasPhoto ? (
          <img
            className="avatar-ring"
            src={user.profile_photo}
            alt=""
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `${ringWidth}px solid ${ringColor}` }}
          />
        ) : (
          <div style={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)',
            border: `${ringWidth}px solid ${ringColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: size * 0.4, lineHeight: 1, color: 'white'
          }}>
            {initial}
          </div>
        )}
      </div>

      {showFull && (
        <div
          onClick={() => setShowFull(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, padding: '3rem 2rem',
            animation: 'avatarLightboxFadeIn 0.15s ease'
          }}
        >
          <style>{`@keyframes avatarLightboxFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}>
            <img
              className="avatar-ring"
              src={user.profile_photo}
              alt={user.username || user.email || 'Profile photo'}
              style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
            />
            <button
              onClick={() => setShowFull(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '-3rem', right: 0,
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', fontSize: '1.1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
            {onClick && (
              <button
                onClick={() => { setShowFull(false); onClick() }}
                style={{
                  position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                  padding: '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none',
                  borderRadius: '999px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                  boxShadow: '0 8px 22px rgba(179,31,47,0.5)'
                }}
              >
                View Profile →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Avatar
