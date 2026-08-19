import { useNavigate } from 'react-router-dom'
import ScrollToTopButton from './UI/ScrollToTopButton'

function UserNotFound({ onGoBack }) {
  const navigate = useNavigate()

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
          fontSize: '4.5rem', margin: '0 0 0.25rem 0', lineHeight: '1',
          filter: 'drop-shadow(0 0 30px rgba(179,31,47,0.5))'
        }}>
          🕵️
        </p>

        <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
          Character not found
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
          This user doesn't exist, or their profile may have been removed.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '0.65rem 1.5rem', backgroundColor: '#b31f2f', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            Back to Discover
          </button>
          <button
            onClick={onGoBack || (() => navigate(-1))}
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

export default UserNotFound
