import { useNavigate } from 'react-router-dom'
import ScrollToTopButton from './UI/ScrollToTopButton'

function NotFound() {
  const navigate = useNavigate()
  const isLoggedIn = !!JSON.parse(localStorage.getItem('user') || 'null')?.token

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '3rem 2.5rem', width: '100%', maxWidth: '440px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="CineLog" style={{ height: '56px', objectFit: 'contain' }} />
        </div>

        <p style={{
          color: 'white', fontSize: '5rem', fontWeight: '800',
          margin: '0 0 0.25rem 0', lineHeight: '1',
          textShadow: '0 0 30px rgba(179,31,47,0.5)'
        }}>
          4<span style={{ color: '#b31f2f' }}>0</span>4
        </p>

        <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
          Scene not found
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
          This page got cut in the edit. The one you're looking for doesn't exist or may have moved.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(isLoggedIn ? '/profile' : '/')}
            style={{
              padding: '0.65rem 1.5rem', backgroundColor: '#b31f2f', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            {isLoggedIn ? 'Back to Discover' : 'Back to Home'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.65rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            Go Back
          </button>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default NotFound
