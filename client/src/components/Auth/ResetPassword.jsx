import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import AuthField from './AuthField'
import PasswordToggle from './PasswordToggle'
import AuthLayout, { AuthHeader, AuthAlert, AuthButton, AuthFooter } from './AuthLayout'
import { AUTH_ICONS, svg } from './authIcons'

// Same rules the server enforces.
const RULES = [
  { test: (p) => p.length >= 8, label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'A number' },
]

const STRENGTH = [
  { label: 'Too weak', color: '#ff5a6c' },
  { label: 'Weak', color: '#ff5a6c' },
  { label: 'Okay', color: '#fbbf24' },
  { label: 'Good', color: '#a3e635' },
  { label: 'Strong', color: '#4ade80' },
]

// 0–4: the four rules, plus a bonus step for length or a symbol.
const strengthOf = (p) => {
  if (!p) return null
  const met = RULES.filter(r => r.test(p)).length
  const bonus = p.length >= 12 || /[^A-Za-z0-9]/.test(p) ? 1 : 0
  return Math.min(4, met === 4 ? 3 + bonus : Math.max(0, met - 1))
}

const REDIRECT_SECONDS = 5
const smallCheck = svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, 12)

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [linkProblem, setLinkProblem] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // after success: count down, then go to sign in
  useEffect(() => {
    if (!success) return
    if (countdown <= 0) { navigate('/login'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, countdown, navigate])

  const rules = RULES.map(r => ({ ...r, ok: r.test(password) }))
  const level = strengthOf(password)
  const strength = level === null ? null : STRENGTH[level]
  const matches = confirmPassword && confirmPassword === password
  const ready = rules.every(r => r.ok) && matches

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!ready) return
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong'
      // an expired / used link can't be fixed by retyping — offer a new one
      if (/token|link|expired/i.test(message)) setLinkProblem(true)
      else setError(message)
    } finally {
      setLoading(false)
    }
  }

  const requestNewLink = (
    <AuthButton type="button" onClick={() => navigate('/forgot-password')}>Request a new link</AuthButton>
  )

  return (
    <AuthLayout backLabel="Sign in" onBack={() => navigate('/login')}>
      {!token || linkProblem ? (
        <>
          <AuthHeader
            badge={<span style={{ display: 'flex', transform: 'scale(1.5)' }}>{AUTH_ICONS.alert}</span>}
            title={token ? 'This link has expired' : 'This link is incomplete'}
            subtitle={token
              ? 'Reset links work once and only for 1 hour. Ask for a new one and use it straight away.'
              : 'The reset link is missing part of its code. Open it again from your email, or ask for a new one.'}
          />
          {requestNewLink}
          <AuthFooter>
            <button type="button" className="auth-link" onClick={() => navigate('/login')}>← Back to sign in</button>
          </AuthFooter>
        </>
      ) : success ? (
        <>
          <AuthHeader
            badge={<span style={{ color: '#4ade80', display: 'flex', transform: 'scale(1.6)' }}>{AUTH_ICONS.check}</span>}
            title="Password updated"
            subtitle="You can now sign in with your new password. For your security, you've been signed out everywhere else."
          />
          <AuthButton type="button" onClick={() => navigate('/login')}>Sign in now</AuthButton>
          {/* countdown bar */}
          <div style={{ marginTop: '1.1rem' }}>
            <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '2px', backgroundColor: '#dc3c4f',
                width: `${(countdown / REDIRECT_SECONDS) * 100}%`, transition: 'width 1s linear'
              }} />
            </div>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', margin: '0.55rem 0 0' }}>
              Taking you to sign in in {countdown}s…
            </p>
          </div>
        </>
      ) : (
        <>
          <AuthHeader
            badge={AUTH_ICONS.key}
            title="Choose a new password"
            subtitle="Make it strong, and different from passwords you use elsewhere."
          />

          {error && <AuthAlert key={error}>{error}</AuthAlert>}

          <form onSubmit={handleSubmit}>
            {/* lets password managers save the new password correctly */}
            <input type="text" name="username" autoComplete="username" hidden readOnly />

            <AuthField
              label="New password"
              icon={AUTH_ICONS.lock}
              type={showPassword ? 'text' : 'password'}
              name="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
              placeholder="At least 8 characters"
              passwordrules="minlength: 8; required: upper; required: lower; required: digit;"
              rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
              labelExtra={strength && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: strength.color }}>{strength.label}</span>}
            />

            {/* strength bar + the rules, ticked as you type */}
            <div style={{ display: 'flex', gap: '0.3rem', margin: '0.6rem 0 0.7rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, height: '4px', borderRadius: '2px', transition: 'background-color 0.25s',
                  backgroundColor: level !== null && i < Math.max(1, level) ? strength.color : 'rgba(255,255,255,0.1)'
                }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem', marginBottom: '1.2rem' }}>
              {rules.map(r => (
                <span key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 600, color: r.ok ? '#4ade80' : '#777', transition: 'color 0.2s' }}>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: r.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (r.ok ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)')
                  }}>{r.ok && smallCheck}</span>
                  {r.label}
                </span>
              ))}
            </div>

            <AuthField
              label="Confirm new password"
              icon={AUTH_ICONS.lock}
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Type it again"
              status={confirmPassword ? (matches ? 'ok' : 'error') : undefined}
              hint={confirmPassword ? (matches ? '✓ Passwords match' : "Passwords don't match yet") : null}
              rightSlot={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />}
              style={{ marginBottom: '1.4rem' }}
            />

            <AuthButton loading={loading} loadingText="Updating…" disabled={!ready}>Update password</AuthButton>
          </form>

          <AuthFooter>
            Remembered it?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('/login')}>Sign in</button>
          </AuthFooter>
        </>
      )}
    </AuthLayout>
  )
}

export default ResetPassword
