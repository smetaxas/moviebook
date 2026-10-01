import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import ReCAPTCHA from 'react-google-recaptcha'
import AuthField from './AuthField'
import PasswordToggle from './PasswordToggle'
import AuthLayout, { AuthHeader, AuthAlert, AuthButton, AuthFooter } from './AuthLayout'
import { AUTH_ICONS } from './authIcons'

const STRENGTH = {
  weak: { label: 'Weak', color: '#ff5a6c', bars: 1, tip: 'Use 8+ characters with upper & lower case and a number' },
  medium: { label: 'Okay', color: '#fbbf24', bars: 2, tip: 'Add a symbol or more length to make it strong' },
  strong: { label: 'Strong', color: '#4ade80', bars: 3, tip: 'Great password' },
}

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const isMobile = useIsMobile()
  const [passwordStrength, setPasswordStrength] = useState('')
  const [usernameSuggestions, setUsernameSuggestions] = useState([])
  const [submitting, setSubmitting] = useState(false)
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
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const isLocalhost = window.location.hostname === 'localhost'
    if (!captchaToken && !isLocalhost) {
      setError('Please complete the CAPTCHA')
      return
    }
    setSubmitting(true)
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
    } finally {
      setSubmitting(false)
    }
  }

  const strength = STRENGTH[passwordStrength]
  const matchStatus = confirmPassword ? (confirmPassword === password ? 'ok' : 'error') : undefined

  return (
    <AuthLayout aside formWidth="440px">
      <AuthHeader title="Create your account" subtitle="Start your movie journal — it's free." onLogoClick={() => navigate('/')} />

      {error && <AuthAlert key={error}>{error}</AuthAlert>}

      <form onSubmit={handleRegister} autoComplete="on">
        <div style={{ marginBottom: '1rem' }}>
          <AuthField
            label="Username"
            icon={AUTH_ICONS.user}
            type="text"
            name="username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setUsernameSuggestions([]) }}
            required
            autoComplete="username"
            placeholder="Pick a username"
          />
          {usernameSuggestions.length > 0 && (
            <div style={{ marginTop: '0.55rem' }}>
              <p style={{ color: '#888', fontSize: '0.76rem', margin: '0 0 0.35rem 0' }}>That one is taken. Try:</p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {usernameSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setUsername(suggestion); setUsernameSuggestions([]) }}
                    style={{ padding: '0.3rem 0.65rem', backgroundColor: 'rgba(179,31,47,0.14)', border: '1px solid rgba(220,60,79,0.4)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem', color: '#ff8a97', fontWeight: 700 }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
          style={{ marginBottom: '1rem' }}
        />

        <div style={{ marginBottom: '1rem' }}>
          <AuthField
            label="Password"
            icon={AUTH_ICONS.lock}
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordStrength(checkPasswordStrength(e.target.value))
            }}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            passwordrules="minlength: 8; required: upper; required: lower; required: digit;"
            rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
          />
          {strength && (
            <div style={{ marginTop: '0.55rem' }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: n <= strength.bars ? strength.color : 'rgba(255,255,255,0.1)', transition: 'background-color 0.25s' }} />
                ))}
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.76rem', color: '#888' }}>
                <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span> · {strength.tip}
              </p>
            </div>
          )}
        </div>

        <AuthField
          label="Confirm password"
          icon={AUTH_ICONS.lock}
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Type it again"
          passwordrules="minlength: 8; required: upper; required: lower; required: digit;"
          status={matchStatus}
          hint={matchStatus === 'ok' ? '✓ Passwords match' : matchStatus === 'error' ? "Passwords don't match yet" : null}
          rightSlot={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem', marginTop: '1.4rem' }}>
          {/* The normal widget is a fixed 304px — wider than this card's
              content on a phone. Its size can't change after render,
              so the key remounts it when crossing the breakpoint. */}
          <ReCAPTCHA
            key={isMobile ? 'compact' : 'normal'}
            size={isMobile ? 'compact' : 'normal'}
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
            theme="dark"
          />
          <AuthButton loading={submitting} loadingText="Creating account…">Create account</AuthButton>
        </div>
      </form>

      <AuthFooter>
        Already have an account?{' '}
        <button type="button" className="auth-link" onClick={() => navigate('/login')}>Sign in</button>
      </AuthFooter>
    </AuthLayout>
  )
}

export default Register
