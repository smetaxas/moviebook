import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

const POSTER_URLS = [
  'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
  'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'https://image.tmdb.org/t/p/w500/9ipbQRgOq6Ilxpwagfa98ikgR9v.jpg',
  'https://image.tmdb.org/t/p/w500/hfExJPcbBtDeFDEb7I1By72Drlr.jpg',
  'https://image.tmdb.org/t/p/w500/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg',
  'https://image.tmdb.org/t/p/w500/8kSerJrhrJWKLk1LViesGcnrUPE.jpg',
  'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  'https://image.tmdb.org/t/p/w500/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
  'https://image.tmdb.org/t/p/w500/4m1Au3YkjqsxF8iwQy0fPYSxE0h.jpg',
  'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
  'https://image.tmdb.org/t/p/w500/vgpXmVaVyUL7GGiDeiK1mKEKzcX.jpg',
  'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
]

function Landing() {
  const navigate = useNavigate()
  const typedPhrase = useTypewriter(HERO_PHRASE)
  const row1 = [...POSTER_URLS, ...POSTER_URLS]
  const row2 = [...POSTER_URLS.slice(4), ...POSTER_URLS, ...POSTER_URLS.slice(0, 4)]
  const row3 = [...POSTER_URLS.slice(8), ...POSTER_URLS, ...POSTER_URLS.slice(0, 8)]

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative'
    }}>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Poster Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', gap: '8px',
        opacity: 0.15, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', animation: 'scrollLeft 60s linear infinite', width: 'max-content' }}>
          {row1.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollRight 70s linear infinite', width: 'max-content' }}>
          {row2.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollLeft 80s linear infinite', width: 'max-content' }}>
          {row3.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollRight 65s linear infinite', width: 'max-content' }}>
          {row1.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.9) 100%)'
      }} />

      {/* Navbar */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="CineLog" style={{ height: '96px', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Hero Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem'
      }}>
        <div style={{
          marginBottom: '1.5rem', minHeight: '1.3rem',
          display: 'inline-flex', alignItems: 'center'
        }}>
          <span style={{
            color: '#ff3b3b', fontSize: '0.95rem', fontWeight: '600',
            letterSpacing: '0.5px',
            textShadow: '0 0 14px rgba(229,9,20,0.85), 0 0 32px rgba(229,9,20,0.4), 0 2px 6px rgba(0,0,0,0.7)'
          }}>
            {typedPhrase}
            <span style={{
              display: 'inline-block', width: '2px', height: '0.9em',
              marginLeft: '3px', verticalAlign: '-0.1em',
              backgroundColor: '#ff3b3b',
              boxShadow: '0 0 8px rgba(229,9,20,0.9)',
              animation: 'cursorBlink 0.9s step-end infinite'
            }} />
          </span>
        </div>

        <h1 style={{
          color: 'white', fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: '800', margin: '0 0 1rem 0',
          lineHeight: '1.1', letterSpacing: '-1px'
        }}>
          Track Every Movie<br />
          <span style={{ color: '#e50914' }}>You've Ever Loved</span>
        </h1>

        <p style={{
          color: '#aaa', fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          maxWidth: '600px', lineHeight: '1.6',
          margin: '0 0 2.5rem 0'
        }}>
          Log movies, discover what's trending, share reviews with friends and never forget a great film again.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '1rem 2.5rem', backgroundColor: '#e50914',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700',
              boxShadow: '0 8px 30px rgba(229,9,20,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(229,9,20,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(229,9,20,0.4)' }}
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '1rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem',
              fontWeight: '600', backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
          >
            Sign In
          </button>
        </div>

        {/* Features */}
        <div style={{
          display: 'flex', gap: '2rem', marginTop: '4rem',
          flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {[
            { icon: '🎬', text: 'Log Movies' },
            { icon: '🔥', text: 'Trending Now' },
            { icon: '🎯', text: 'Watchlist' },
            { icon: '🌍', text: 'Community' },
            { icon: '⭐', text: 'Rate & Review' },
            { icon: '🎭', text: 'Browse by Genre' },
          ].map((feature, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50px', padding: '0.5rem 1rem'
            }}>
              <span style={{ fontSize: '1rem' }}>{feature.icon}</span>
              <span style={{ color: '#ddd', fontSize: '0.85rem', fontWeight: '500' }}>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '1.5rem',
        color: '#555', fontSize: '0.8rem'
      }}>
        © 2026 CineLog — Built with ❤️ for movie lovers
      </div>
    </div>
  )
}

export default Landing