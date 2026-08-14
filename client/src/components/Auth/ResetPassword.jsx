import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none'
  }

  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) return ''
    if (pass.length < 8) return 'weak'
    const hasUpper = /[A-Z]/.test(pass)
    const hasLower = /[a-z]/.test(pass)
    const hasNumber = /[0-9]/.test(pass)
    const score = [hasUpper, hasLower, hasNumber].filter(Boolean).length
    if (pass.length >= 10 && score === 3) return 'strong'
    if (pass.length >= 8 && score >= 2) return 'medium'
    return 'weak'
  }

  const passwordStrength = checkPasswordStrength(password)
  const strengthColor = passwordStrength === 'weak' ? '#e50914' : passwordStrength === 'medium' ? '#ffa500' : '#00c800'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!token) {
      setError('Invalid reset link')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
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
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>Cine<span style={{ color: '#e50914' }}>Log</span></h1>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</p>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Password Reset!</h3>
            <p style={{ color: '#aaa' }}>Redirecting to login...</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
              Enter your new password
            </p>

            {error && (
              <p style={{ color: '#e50914', backgroundColor: 'rgba(229,9,20,0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            {!token && (
              <p style={{ color: '#e50914', textAlign: 'center', marginBottom: '1rem' }}>
                Invalid or missing reset token.
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ ...inputStyle, paddingRight: '3rem' }}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
                {passwordStrength && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: '#e50914' }} />
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: passwordStrength === 'medium' || passwordStrength === 'strong' ? '#ffa500' : '#333' }} />
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: passwordStrength === 'strong' ? '#00c800' : '#333' }} />
                    </div>
                    <p style={{ color: strengthColor, fontSize: '0.8rem', margin: 0 }}>
                      {passwordStrength === 'weak' ? 'Weak password' : passwordStrength === 'medium' ? 'Medium password' : 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: '3rem' }}
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading || !token} style={{
                width: '100%', padding: '0.75rem', backgroundColor: '#e50914',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: loading || !token ? 'default' : 'pointer',
                fontSize: '1rem', fontWeight: 'bold',
                opacity: loading || !token ? 0.7 : 1
              }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <p style={{ color: '#aaa', textAlign: 'center', marginTop: '1.5rem' }}>
              <span onClick={() => navigate('/login')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }}>
                Back to Login
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword