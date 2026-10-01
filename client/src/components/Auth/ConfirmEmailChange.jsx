import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import AuthLayout, { AuthHeader, AuthFooter } from './AuthLayout'
import { AUTH_ICONS } from './authIcons'

// Opened from the link in the "Confirm your new email" message. Works
// whether or not you're signed in on this device: the link itself is the
// proof that the new inbox is yours.
function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState(token ? { status: 'working' } : { status: 'error', message: 'This confirmation link is missing its code. Open the link from the email again.' })
  const signedIn = Boolean(JSON.parse(localStorage.getItem('user') || 'null')?.token)
  // The link is single-use: make sure it's sent once even if React runs the
  // effect twice (development mode does).
  const sentRef = useRef(false)

  useEffect(() => {
    if (!token || sentRef.current) return
    sentRef.current = true
    api.post('/user/account/email/confirm', { token })
      .then(res => {
        const stored = JSON.parse(localStorage.getItem('user') || 'null')
        if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, email: res.data.email }))
        setState({ status: 'done', email: res.data.email })
      })
      .catch(err => setState({ status: 'error', message: err.response?.data?.message || 'Something went wrong. Please try again.' }))
  }, [token])

  const spinner = (
    <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid rgba(220,60,79,0.25)', borderTopColor: '#ff6b7d', animation: 'authSpin 0.8s linear infinite' }} />
  )
  const primary = signedIn
    ? { label: 'Go to my account', to: '/account' }
    : { label: 'Sign in', to: '/login' }

  return (
    <AuthLayout backLabel="Home">
      {state.status === 'working' && (
        <AuthHeader badge={spinner} title="Confirming your email…" subtitle="This only takes a moment." />
      )}

      {state.status === 'done' && (
        <>
          <AuthHeader
            badge={<span style={{ color: '#4ade80', display: 'flex', transform: 'scale(1.6)' }}>{AUTH_ICONS.check}</span>}
            title="Email changed"
            subtitle={<>Your account now uses <strong style={{ color: 'white', overflowWrap: 'anywhere' }}>{state.email}</strong>. Use it the next time you sign in.</>}
          />
          <button type="button" className="auth-btn" onClick={() => navigate(primary.to)} style={{
            width: '100%', height: '52px', border: 'none', borderRadius: '14px', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #e0394f 0%, #b31f2f 100%)', boxShadow: '0 6px 18px rgba(179,31,47,0.35)'
          }}>{primary.label}</button>
        </>
      )}

      {state.status === 'error' && (
        <>
          <AuthHeader badge={<span style={{ display: 'flex', transform: 'scale(1.5)' }}>{AUTH_ICONS.alert}</span>} title="Couldn't confirm your email" subtitle={state.message} />
          <button type="button" className="auth-btn" onClick={() => navigate(primary.to)} style={{
            width: '100%', height: '52px', borderRadius: '14px', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700,
            backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)'
          }}>{primary.label}</button>
          <AuthFooter>
            Your email hasn't changed. You can request the change again from <strong style={{ color: '#ddd' }}>My account</strong>.
          </AuthFooter>
        </>
      )}
    </AuthLayout>
  )
}

export default ConfirmEmailChange
