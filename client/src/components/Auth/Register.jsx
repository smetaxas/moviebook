import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import ReCAPTCHA from 'react-google-recaptcha'

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

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none'
  }

  const strengthColor = passwordStrength === 'weak' ? '#e50914' : passwordStrength === 'medium' ? '#ffa500' : '#00c800'

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
        position: 'relative', zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>🎬 MovieBook</h1>
        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>Create your account</p>

        {error && (
          <p style={{ color: '#e50914', backgroundColor: 'rgba(229,9,20,0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} autoComplete="on">
          {/* Username */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameSuggestions([]) }}
              required
              autoComplete="username"
              style={inputStyle}
            />
            {usernameSuggestions.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>Try one of these:</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {usernameSuggestions.map((suggestion, i) => (
                    <span
                      key={i}
                      onClick={() => { setUsername(suggestion); setUsernameSuggestions([]) }}
                      style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(229,9,20,0.1)', border: '1px solid #e50914', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#e50914' }}
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordStrength(checkPasswordStrength(e.target.value))
                }}
                required
                autoComplete="new-password"
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
                  {passwordStrength === 'weak' ? '⚠️ Weak password' : passwordStrength === 'medium' ? '👍 Medium password' : '✅ Strong password'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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

          {/* reCAPTCHA */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              theme="dark"
            />
          </div>

          <button type="submit" style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#e50914',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
          }}>
            Create Account
          </button>
        </form>

        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }}>
            Login
          </span>
        </p>
      </div>
    </div>
  )
}

export default Register