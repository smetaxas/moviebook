import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>CineLog</h1>

        {submitted ? (
          <>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
              If an account exists for <strong style={{ color: 'white' }}>{email}</strong>, a password reset link has been sent. Check your inbox.
            </p>
            <p style={{ textAlign: 'center' }}>
              <span onClick={() => navigate('/login')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Back to Login
              </span>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
              Enter your email and we'll send you a reset link
            </p>

            {error && (
              <p style={{ color: '#e50914', backgroundColor: 'rgba(229,9,20,0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={inputStyle}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.75rem', backgroundColor: '#e50914',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: loading ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 'bold',
                opacity: loading ? 0.7 : 1
              }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ color: '#aaa', textAlign: 'center', marginTop: '1.5rem' }}>
              <span onClick={() => navigate('/login')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Back to Login
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
