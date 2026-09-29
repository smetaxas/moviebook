import { useState } from 'react'

// Same lightbox pattern as Avatar's expandOnClick photo popup — a dark
// backdrop click closes it, the player itself doesn't.
function TrailerModal({ trailerKey, onClose }) {
  const [closeHover, setCloseHover] = useState(false)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 4000, padding: '3.5rem var(--page-pad)',
        animation: 'trailerModalFadeIn 0.15s ease'
      }}
    >
      <style>{`@keyframes trailerModalFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(100%, 960px)' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
            title="Trailer"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          onMouseEnter={() => setCloseHover(true)}
          onMouseLeave={() => setCloseHover(false)}
          style={{
            position: 'absolute', top: '-3rem', right: 0,
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: closeHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.15s'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default TrailerModal
