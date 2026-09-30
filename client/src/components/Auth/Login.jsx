import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Emoji from '../UI/Emoji'
import AuthField from './AuthField'
import AuthCheckbox from './AuthCheckbox'
import PasswordToggle from './PasswordToggle'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import PosterBackdrop from '../UI/PosterBackdrop'
import BackButton from '../UI/BackButton'

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
  const [submitHover, setSubmitHover] = useState(false)
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
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
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
    }
  }

  const submitButtonStyle = {
    width: '100%', padding: '0.9rem',
    background: submitHover ? 'linear-gradient(135deg, #e2485b 0%, #c42a3c 100%)' : 'linear-gradient(135deg, #d23046 0%, #b31f2f 100%)',
    color: 'white', border: 'none', borderRadius: '12px',
    cursor: 'pointer', fontSize: '1rem', fontWeight: '700',
    boxShadow: submitHover ? '0 8px 22px rgba(179,31,47,0.5)' : '0 4px 14px rgba(179,31,47,0.3)',
    transform: submitHover ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'box-shadow 0.15s, transform 0.15s'
  }

  return (
    <div style={{
      // svh + padding: the card is centred in the part of the screen that's
      // actually visible on a phone, and never touches the screen edges.
      minHeight: '100svh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '4.25rem 1rem 1.5rem', boxSizing: 'border-box',
      overflow: 'hidden', position: 'relative'
    }}>
      <style>{`
        @keyframes authCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <PosterBackdrop
        opacity={0.22}
        overlay="radial-gradient(ellipse 80% 60% at 50% 50%, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.74) 60%, rgba(8,8,8,0.6) 100%)"
      />
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(820px, 140vw)', height: 'min(820px, 140vw)', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(179,31,47,0.2) 0%, transparent 62%)'
      }} />

      {/* A way back to the home page — there wasn't one. */}
      <BackButton onClick={() => navigate('/')} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 11 }}>
        Home
      </BackButton>

      <div className="auth-card" style={{
        position: 'relative', overflow: 'hidden', zIndex: 10,
        background: 'linear-gradient(160deg, rgba(30,30,30,0.92) 0%, rgba(14,14,14,0.92) 100%)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '22px', padding: 'var(--card-pad)', width: '100%', maxWidth: '410px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(179,31,47,0.05)',
        animation: 'authCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.25) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        {!show2FA ? (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <img src="/logo.png" alt="CineLog" onClick={() => navigate('/')} style={{ height: '68px', objectFit: 'contain', cursor: 'pointer' }} />
            </div>
            <h1 style={{ color: 'white', textAlign: 'center', margin: '0 0 0.35rem 0', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back</h1>
            <p style={{ color: '#999', textAlign: 'center', margin: '0 0 1.6rem 0', fontSize: '0.9rem' }}>Sign in to continue your movie journal</p>

            {verified && (
              <p style={{ color: '#00c800', backgroundColor: 'rgba(0,200,0,0.1)', border: '1px solid rgba(0,200,0,0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Email verified successfully! You can now login.
              </p>
            )}

            {error && (
              <p style={{ color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(179,31,47,0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </p>
            )}

            <form onSubmit={handleLogin}>
              <AuthField
                label="Email"
                icon="✉️"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ marginBottom: '1.1rem' }}
              />

              <AuthField
                label="Password"
                icon="🔒"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
                style={{ marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <AuthCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
                <span
                  onClick={() => navigate('/forgot-password')}
                  style={{ color: '#dc3c4f', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
                style={submitButtonStyle}
              >
                Sign In
              </button>
            </form>

            <p style={{ color: '#999', textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} style={{ color: '#dc3c4f', cursor: 'pointer', fontWeight: '700' }}>
                Create one
              </span>
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 800 }}><Emoji>🔐</Emoji> 2FA</h1>
            <p style={{ color: '#999', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Open your authenticator app and enter the 6-digit code</p>

            {twoFAError && (
              <p style={{ color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(179,31,47,0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {twoFAError}
              </p>
            )}

            <form onSubmit={handle2FASubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#888', display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>6-digit code</label>
                <input
                  type="text"
                  className="code-input"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'white', boxSizing: 'border-box', outline: 'none',
                    textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 700
                  }}
                />
              </div>

              <button
                type="submit"
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
                style={submitButtonStyle}
              >
                Verify
              </button>
            </form>

            <p style={{ color: '#999', textAlign: 'center', marginTop: '1.5rem' }}>
              <BackButton variant="link" onClick={() => setShow2FA(false)}>Back to Login</BackButton>
            </p>
          </div>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default Login
