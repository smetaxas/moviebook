import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Emoji from '../UI/Emoji'
import AuthField from './AuthField'
import AuthCheckbox from './AuthCheckbox'
import ScrollToTopButton from '../UI/ScrollToTopButton'

const POSTER_URLS = [
  'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
  'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'https://image.tmdb.org/t/p/w500/9ipbQRgOq6Ilxpwagfa98ikgR9v.jpg',
  'https://image.tmdb.org/t/p/w500/hfExJPcbBtDeFDEb7I1By72Drlr.jpg',
  'https://image.tmdb.org/t/p/w500/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg',
  'https://image.tmdb.org/t/p/w500/8kSerJrhrJWKLk1LViesGcnrUPE.jpg',
  'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  'https://image.tmdb.org/t/p/w500/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
  'https://image.tmdb.org/t/p/w500/4m1Au3YkjqsxF8iwQy0fPYSxE0h.jpg',
  'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
  'https://image.tmdb.org/t/p/w500/vgpXmVaVyUL7GGiDeiK1mKEKzcX.jpg',
  'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
]

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
  const [eyeHover, setEyeHover] = useState(false)
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

  const row1 = [...POSTER_URLS, ...POSTER_URLS]
  const row2 = [...POSTER_URLS.slice(4), ...POSTER_URLS, ...POSTER_URLS.slice(0, 4)]

  const submitButtonStyle = {
    width: '100%', padding: '0.85rem', backgroundColor: submitHover ? '#dc3c4f' : '#b31f2f',
    color: 'white', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontSize: '1rem', fontWeight: '700',
    boxShadow: submitHover ? '0 8px 22px rgba(179,31,47,0.5)' : '0 4px 14px rgba(179,31,47,0.3)',
    transform: submitHover ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'background-color 0.15s, box-shadow 0.15s, transform 0.15s'
  }

  const eyeToggle = (value, setter) => (
    <span
      onClick={() => setter(!value)}
      onMouseEnter={() => setEyeHover(true)}
      onMouseLeave={() => setEyeHover(false)}
      style={{ cursor: 'pointer', fontSize: '1.1rem', opacity: eyeHover ? 1 : 0.7, transition: 'opacity 0.15s' }}
    >
      <Emoji>{value ? '🙈' : '👁️'}</Emoji>
    </span>
  )

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative'
    }}>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', gap: '8px',
        opacity: 0.2, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', animation: 'scrollLeft 100s linear infinite', width: 'max-content' }}>
          {row1.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollRight 100s linear infinite', width: 'max-content' }}>
          {row2.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollLeft 100s linear infinite', width: 'max-content' }}>
          {row1.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)'
      }} />

      <div style={{
        position: 'relative', overflow: 'hidden', zIndex: 10,
        background: 'linear-gradient(160deg, rgba(30,30,30,0.9) 0%, rgba(14,14,14,0.9) 100%)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(179,31,47,0.05)'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.25) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        {!show2FA ? (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <img src="/logo.png" alt="CineLog" style={{ height: '64px', objectFit: 'contain' }} />
            </div>
            <p style={{ color: '#999', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Sign in to your account</p>

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
                rightSlot={eyeToggle(showPassword, setShowPassword)}
                style={{ marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                Login
              </button>
            </form>

            <p style={{ color: '#999', textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} style={{ color: '#dc3c4f', cursor: 'pointer', fontWeight: '700' }}>
                Register
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
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
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
              <span onClick={() => setShow2FA(false)} style={{ color: '#dc3c4f', cursor: 'pointer', fontWeight: '700' }}>
                ← Back to Login
              </span>
            </p>
          </div>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default Login
