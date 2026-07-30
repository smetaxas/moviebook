import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
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

        {!token ? (
          <>
            <p style={{ color: '#e50914', textAlign: 'center', marginBottom: '2rem' }}>
              This reset link is missing its token. Please request a new one.
            </p>
            <p style={{ textAlign: 'center' }}>
              <span onClick={() => navigate('/forgot-password')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }}>
                Request New Link
              </span>
            </p>
          </>
        ) : success ? (
          <>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
              Your password has been updated. You can now log in.
            </p>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '0.75rem', backgroundColor: '#e50914',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
            }}>
              Go to Login
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
              Choose a new password
            </p>

            {error && (
              <p style={{ color: '#e50914', backgroundColor: 'rgba(229,9,20,0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.75rem', backgroundColor: '#e50914',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: loading ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 'bold',
                opacity: loading ? 0.7 : 1
              }}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
