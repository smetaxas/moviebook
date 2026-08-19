import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import ReCAPTCHA from 'react-google-recaptcha'
import Emoji from '../UI/Emoji'
import AuthField from './AuthField'
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

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [passwordStrength, setPasswordStrength] = useState('')
  const [usernameSuggestions, setUsernameSuggestions] = useState([])
  const [submitHover, setSubmitHover] = useState(false)
  const recaptchaRef = useRef(null)
  const navigate = useNavigate()

  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) return ''
    if (pass.length < 6) return 'weak'
    const hasUpper = /[A-Z]/.test(pass)
    const hasLower = /[a-z]/.test(pass)
    const hasNumber = /[0-9]/.test(pass)
    const hasSpecial = /[!@#$%^&*]/.test(pass)
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    if (pass.length >= 10 && score >= 3) return 'strong'
    if (pass.length >= 8 && score >= 2) return 'medium'
    return 'weak'
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const isLocalhost = window.location.hostname === 'localhost'
    if (!captchaToken && !isLocalhost) {
      setError('Please complete the CAPTCHA')
      return
    }
    try {
      const res = await api.post('/auth/register', {
        email, password, username,
        captchaToken: captchaToken || 'localhost-bypass'
      })
      localStorage.setItem('user', JSON.stringify(res.data))
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
      if (err.response?.data?.suggestions) {
        setUsernameSuggestions(err.response.data.suggestions)
      }
      if (recaptchaRef.current) recaptchaRef.current.reset()
      setCaptchaToken(null)
    }
  }

  const row1 = [...POSTER_URLS, ...POSTER_URLS]
  const row2 = [...POSTER_URLS.slice(4), ...POSTER_URLS, ...POSTER_URLS.slice(0, 4)]

  const strengthColor = passwordStrength === 'weak' ? '#dc3c4f' : passwordStrength === 'medium' ? '#ffa500' : '#00c800'

  const eyeToggle = (value, setter) => (
    <span
      onClick={() => setter(!value)}
      style={{ cursor: 'pointer', fontSize: '1.1rem', opacity: 0.75, transition: 'opacity 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 1 }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 0.75 }}
    >
      <Emoji>{value ? '🙈' : '👁️'}</Emoji>
    </span>
  )

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative', padding: '2rem 1rem'
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
        <div style={{ display: 'flex', animation: 'scrollLeft 80s linear infinite', width: 'max-content' }}>
          {row1.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollRight 70s linear infinite', width: 'max-content' }}>
          {row2.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '150px', height: '225px', objectFit: 'cover', marginRight: '8px', borderRadius: '4px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', animation: 'scrollLeft 90s linear infinite', width: 'max-content' }}>
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
        borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '600px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(179,31,47,0.05)'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.25) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <img src="/logo.png" alt="CineLog" style={{ height: '64px', objectFit: 'contain' }} />
          </div>
          <p style={{ color: '#999', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Create your account</p>

          {error && (
            <p style={{ color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(179,31,47,0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleRegister} autoComplete="on">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <AuthField
                  label="Username"
                  icon="👤"
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameSuggestions([]) }}
                  required
                  autoComplete="username"
                />
                {usernameSuggestions.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ color: '#888', fontSize: '0.78rem', margin: '0 0 0.3rem 0' }}>Try one of these:</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {usernameSuggestions.map((suggestion, i) => (
                        <span
                          key={i}
                          onClick={() => { setUsername(suggestion); setUsernameSuggestions([]) }}
                          style={{ padding: '0.25rem 0.55rem', backgroundColor: 'rgba(179,31,47,0.12)', border: '1px solid rgba(179,31,47,0.4)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem', color: '#dc3c4f', fontWeight: 600 }}
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <AuthField
                label="Email"
                icon="✉️"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <AuthField
                  label="Password"
                  icon="🔒"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordStrength(checkPasswordStrength(e.target.value))
                  }}
                  required
                  autoComplete="new-password"
                  rightSlot={eyeToggle(showPassword, setShowPassword)}
                />
                {passwordStrength && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: '#b31f2f' }} />
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: passwordStrength === 'medium' || passwordStrength === 'strong' ? '#ffa500' : '#333' }} />
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: passwordStrength === 'strong' ? '#00c800' : '#333' }} />
                    </div>
                    <p style={{ color: strengthColor, fontSize: '0.78rem', margin: 0, fontWeight: 600 }}>
                      {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                    </p>
                  </div>
                )}
              </div>
              <AuthField
                label="Confirm Password"
                icon="🔒"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                rightSlot={eyeToggle(showConfirmPassword, setShowConfirmPassword)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem', marginTop: '1.5rem' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
                theme="dark"
              />
              <button
                type="submit"
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
                style={{
                  width: '100%', padding: '0.85rem', backgroundColor: submitHover ? '#dc3c4f' : '#b31f2f',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '700',
                  boxShadow: submitHover ? '0 8px 22px rgba(179,31,47,0.5)' : '0 4px 14px rgba(179,31,47,0.3)',
                  transform: submitHover ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'background-color 0.15s, box-shadow 0.15s, transform 0.15s'
                }}
              >
                Create Account
              </button>
            </div>
          </form>

          <p style={{ color: '#999', textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#dc3c4f', cursor: 'pointer', fontWeight: '700' }}>
              Login
            </span>
          </p>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default Register
