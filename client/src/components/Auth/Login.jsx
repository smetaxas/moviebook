import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import AuthField from './AuthField'
import AuthCheckbox from './AuthCheckbox'
import PasswordToggle from './PasswordToggle'
import AuthLayout, { AuthHeader, AuthAlert, AuthButton, AuthFooter } from './AuthLayout'
import { AUTH_ICONS } from './authIcons'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [tempUserId, setTempUserId] = useState(null)
  const [twoFAError, setTwoFAError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.requires2FA) {
        setTempUserId(res.data.userId)
        setShow2FA(true)
      } else {
        localStorage.setItem('user', JSON.stringify(res.data))
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }
        navigate('/profile')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    setTwoFAError('')
    setSubmitting(true)
    try {
      const res = await api.post('/2fa/validate', { userId: tempUserId, token: twoFACode })
      localStorage.setItem('user', JSON.stringify(res.data))
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      navigate('/profile')
    } catch (err) {
      setTwoFAError(err.response?.data?.message || 'Invalid code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={!show2FA}>
      {!show2FA ? (
        <>
          <AuthHeader title="Welcome back" subtitle="Sign in to continue your movie journal" onLogoClick={() => navigate('/')} />

          {verified && <AuthAlert kind="success">Email verified! You can sign in now.</AuthAlert>}
          {error && <AuthAlert key={error}>{error}</AuthAlert>}

          <form onSubmit={handleLogin}>
            <AuthField
              label="Email"
              icon={AUTH_ICONS.mail}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={{ marginBottom: '1.1rem' }}
            />

            <AuthField
              label="Password"
              icon={AUTH_ICONS.lock}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
              labelExtra={<button type="button" className="auth-link" onClick={() => navigate('/forgot-password')} style={{ fontSize: '0.8rem' }}>Forgot password?</button>}
              rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
              style={{ marginBottom: '1.1rem' }}
            />

            <div style={{ marginBottom: '1.4rem' }}>
              <AuthCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
            </div>

            <AuthButton loading={submitting} loadingText="Signing in…">Sign in</AuthButton>
          </form>

          <AuthFooter>
            New to CineLog?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('/register')}>Create an account</button>
          </AuthFooter>
        </>
      ) : (
        <>
          <AuthHeader badge={AUTH_ICONS.shield} title="Two-step verification" subtitle="Open your authenticator app and enter the 6-digit code." />

          {twoFAError && <AuthAlert key={twoFAError}>{twoFAError}</AuthAlert>}

          <form onSubmit={handle2FASubmit}>
            <input
              type="text"
              className="code-input"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="6-digit code"
              required
              autoFocus
              style={{
                width: '100%', height: '62px', marginBottom: '1.4rem', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white', boxSizing: 'border-box', outline: 'none',
                textAlign: 'center', fontSize: '1.7rem', letterSpacing: '0.55rem', fontWeight: 800,
                fontVariantNumeric: 'tabular-nums'
              }}
            />
            <AuthButton loading={submitting} loadingText="Verifying…" disabled={twoFACode.length < 6}>Verify</AuthButton>
          </form>

          <AuthFooter>
            <button type="button" className="auth-link" onClick={() => { setShow2FA(false); setTwoFACode(''); setTwoFAError('') }}>← Back to sign in</button>
          </AuthFooter>
        </>
      )}
    </AuthLayout>
  )
}

export default Login
