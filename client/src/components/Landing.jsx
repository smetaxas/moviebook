import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PosterBackdrop from './UI/PosterBackdrop'
import useIsMobile from '../hooks/useIsMobile'

const HERO_PHRASE = 'Your Personal Movie Journal'

function useTypewriter(text, { typingSpeed = 80, deletingSpeed = 40, pauseTime = 1800, pauseEmpty = 500 } = {}) {
  const [display, setDisplay] = useState('')
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    let timeout
    if (phase === 'typing') {
      if (display.length < text.length) {
        timeout = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), typingSpeed)
      } else {
        timeout = setTimeout(() => setPhase('deleting'), pauseTime)
      }
    } else {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(text.slice(0, display.length - 1)), deletingSpeed)
      } else {
        timeout = setTimeout(() => setPhase('typing'), pauseEmpty)
      }
    }
    return () => clearTimeout(timeout)
  }, [display, phase, text, typingSpeed, deletingSpeed, pauseTime, pauseEmpty])

  return display
}

const FEATURES = [
  { icon: '🎬', title: 'Log Movies', text: 'Keep a diary of everything you watch.' },
  { icon: '⭐', title: 'Rate & Review', text: 'Score films from one to five stars.' },
  { icon: '🎯', title: 'Watchlist', text: 'Save the ones you want to see next.' },
  { icon: '🔥', title: 'Trending Now', text: "See what's popular this week." },
  { icon: '🌍', title: 'Community', text: 'Read and share comments on any film.' },
  { icon: '🎭', title: 'Browse Genres', text: 'Find something by genre and year.' },
]

function Landing() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const typedPhrase = useTypewriter(HERO_PHRASE)

  // Staggered entrance: each block rises in slightly after the one above.
  const rise = (step) => ({ animation: 'landingRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: `${step * 90}ms` })

  return (
    <div style={{
      // svh, not vh: on phones 100vh includes the area behind the browser's
      // address bar, which pushed the footer (and part of the hero) off-screen.
      minHeight: '100svh', backgroundColor: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative'
    }}>
      <style>{`
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes landingRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Posters stay visible around the edges; the centre is dimmed so the
          headline always has contrast, whatever poster drifts behind it. */}
      <PosterBackdrop
        opacity={0.22}
        overlay="radial-gradient(ellipse 85% 65% at 50% 42%, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.72) 55%, rgba(10,10,10,0.5) 100%), linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, transparent 25%, transparent 70%, #0a0a0a 100%)"
      />
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-18%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(900px, 140vw)', height: 'min(900px, 140vw)', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(179,31,47,0.22) 0%, transparent 62%)'
      }} />

      {/* Top bar */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
        padding: isMobile ? '1.1rem 1.1rem 0' : '1.5rem 3rem 0'
      }}>
        <img src="/logo.png" alt="CineLog" style={{ height: isMobile ? '64px' : '84px', objectFit: 'contain' }} />
      </header>

      {/* Hero */}
      <main style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: isMobile ? '1.5rem 1.25rem 1rem' : '2rem'
      }}>
        <div className="landing-rise" style={{
          ...rise(0),
          marginBottom: isMobile ? '1rem' : '1.4rem',
          padding: '0.4rem 1rem', minHeight: '2.1rem',
          display: 'inline-flex', alignItems: 'center',
          backgroundColor: 'rgba(179,31,47,0.12)', border: '1px solid rgba(179,31,47,0.35)',
          borderRadius: '999px'
        }}>
          <span style={{ color: '#ff6b7d', fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            {typedPhrase}
            <span style={{
              display: 'inline-block', width: '2px', height: '0.95em',
              marginLeft: '3px', verticalAlign: '-0.12em',
              backgroundColor: '#ff6b7d',
              animation: 'cursorBlink 0.9s step-end infinite'
            }} />
          </span>
        </div>

        <h1 className="landing-rise" style={{
          ...rise(1),
          color: 'white', fontSize: 'clamp(2rem, 8.4vw, 4.75rem)',
          fontWeight: 800, margin: '0 0 1rem 0',
          lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance'
        }}>
          Track Every Movie<br />
          <span style={{
            background: 'linear-gradient(90deg, #ff5a6c 0%, #b31f2f 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
          }}>
            You've Ever Loved
          </span>
        </h1>

        <p className="landing-rise" style={{
          ...rise(2),
          color: '#b5b5b5', fontSize: 'clamp(0.98rem, 2vw, 1.2rem)',
          maxWidth: '560px', lineHeight: 1.6, textWrap: 'balance',
          margin: isMobile ? '0 0 1.6rem 0' : '0 0 2.25rem 0'
        }}>
          Log movies, discover what's trending, share reviews with friends and never forget a great film again.
        </p>

        {/* On a phone the two actions are full-width and stacked, so they're
            the same size and easy to hit with a thumb. */}
        <div className="landing-rise" style={{
          ...rise(3),
          display: 'flex', gap: '0.75rem', justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '340px' : 'none'
        }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: isMobile ? '0.95rem 1.5rem' : '1rem 2.5rem',
              background: 'linear-gradient(135deg, #d23046 0%, #b31f2f 100%)',
              color: 'white', border: 'none', borderRadius: '12px',
              cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700,
              boxShadow: '0 10px 30px rgba(179,31,47,0.45)'
            }}
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: isMobile ? '0.95rem 1.5rem' : '1rem 2.5rem',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 600,
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            Sign In
          </button>
        </div>

        {/* Features: an even grid (2 across on phones, 3 on desktop) instead
            of pills that wrapped into ragged rows. */}
        <div className="landing-rise" style={{
          ...rise(4),
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.55rem' : '0.9rem',
          width: '100%', maxWidth: isMobile ? '340px' : '860px',
          marginTop: isMobile ? '1.75rem' : '3.5rem'
        }}>
          {FEATURES.map(feature => (
            <div key={feature.title} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? '0.55rem' : '0.85rem',
              textAlign: 'left',
              backgroundColor: 'rgba(20,20,20,0.72)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '14px',
              padding: isMobile ? '0.6rem 0.65rem' : '0.95rem 1.1rem',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
            }}>
              <span style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px',
                borderRadius: '10px', fontSize: isMobile ? '0.95rem' : '1.2rem',
                backgroundColor: 'rgba(179,31,47,0.16)', border: '1px solid rgba(179,31,47,0.3)'
              }}>
                {feature.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', margin: 0, fontSize: isMobile ? '0.8rem' : '0.95rem', fontWeight: 700, lineHeight: 1.25 }}>{feature.title}</p>
                {!isMobile && (
                  <p style={{ color: '#999', margin: '0.2rem 0 0 0', fontSize: '0.8rem', lineHeight: 1.35 }}>{feature.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: isMobile ? '1rem' : '1.5rem',
        color: '#666', fontSize: '0.78rem'
      }}>
        © 2026 CineLog — Built with ❤️ for movie lovers
      </footer>
    </div>
  )
}

export default Landing
