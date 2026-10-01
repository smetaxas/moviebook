import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import AuthField from './AuthField'
import AuthLayout, { AuthHeader, AuthAlert, AuthButton, AuthFooter } from './AuthLayout'
import { AUTH_ICONS } from './authIcons'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

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

  const backToLogin = (
    <AuthFooter>
      <button type="button" className="auth-link" onClick={() => navigate('/login')}>← Back to sign in</button>
    </AuthFooter>
  )

  return (
    <AuthLayout backLabel="Sign in" onBack={() => navigate('/login')}>
      {submitted ? (
        <>
          <AuthHeader
            badge={AUTH_ICONS.inbox}
            title="Check your inbox"
            subtitle={<>If an account exists for <strong style={{ color: 'white', overflowWrap: 'anywhere' }}>{email}</strong>, we've sent a link to reset your password.</>}
          />
          <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#999', fontSize: '0.84rem', lineHeight: 1.5 }}>
            Didn't get it? Check your spam folder, or{' '}
            <button type="button" className="auth-link" onClick={() => setSubmitted(false)}>try another email</button>.
          </div>
          {backToLogin}
        </>
      ) : (
        <>
          <AuthHeader
            badge={AUTH_ICONS.key}
            title="Forgot your password?"
            subtitle="No worries. Enter your email and we'll send you a reset link."
          />

          {error && <AuthAlert key={error}>{error}</AuthAlert>}

          <form onSubmit={handleSubmit}>
            <AuthField
              label="Email"
              icon={AUTH_ICONS.mail}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              style={{ marginBottom: '1.4rem' }}
            />
            <AuthButton loading={loading} loadingText="Sending…">Send reset link</AuthButton>
          </form>

          {backToLogin}
        </>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
