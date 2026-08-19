import { useNavigate } from 'react-router-dom'
import ScrollToTopButton from './UI/ScrollToTopButton'

function BadRequest({ message }) {
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
          color: 'white', fontSize: '5rem', fontWeight: '800',
          margin: '0 0 0.25rem 0', lineHeight: '1',
          textShadow: '0 0 30px rgba(179,31,47,0.5)'
        }}>
          4<span style={{ color: '#b31f2f' }}>0</span>0
        </p>

        <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
          Bad request
        </h1>
        <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
          {message || "This link is missing something it needs. Double-check the URL, or it may have been copied incorrectly."}
        </p>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '0.65rem 1.5rem', backgroundColor: '#b31f2f', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.9rem'
          }}
        >
          Back to Login
        </button>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default BadRequest
