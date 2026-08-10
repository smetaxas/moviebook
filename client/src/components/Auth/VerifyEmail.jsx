import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

function VerifyEmail() {
  const [status, setStatus] = useState('verifying')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
    }
  }, [])

  const verifyEmail = async (token) => {
    try {
      await api.get(`/auth/verify-email?token=${token}`)
      setStatus('success')
      setTimeout(() => navigate('/login?verified=true'), 3000)
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px',
        width: '90%', maxWidth: '400px', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {status === 'verifying' && (
          <>
            <p style={{ fontSize: '3rem' }}>⏳</p>
            <h2 style={{ color: 'white' }}>Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <p style={{ fontSize: '3rem' }}>✅</p>
            <h2 style={{ color: 'white' }}>Email verified!</h2>
            <p style={{ color: '#aaa' }}>Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={{ fontSize: '3rem' }}>❌</p>
            <h2 style={{ color: 'white' }}>Verification failed</h2>
            <p style={{ color: '#aaa' }}>Invalid or expired link.</p>
            <button
              onClick={() => navigate('/login')}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail