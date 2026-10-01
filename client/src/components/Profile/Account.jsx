import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import Avatar from '../UI/Avatar'
import useIsMobile from '../../hooks/useIsMobile'
import AuthField from '../Auth/AuthField'
import PasswordToggle from '../Auth/PasswordToggle'
import { AuthAlert } from '../Auth/AuthLayout'
import { AUTH_ICONS } from '../Auth/authIcons'
import TwoFactorSetup from './TwoFactorSetup'

const styles = `
  @keyframes acFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes acPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @keyframes acSpin { to { transform: rotate(360deg); } }
  @keyframes acPop { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
  .ac-btn { -webkit-tap-highlight-color: transparent; transition: background-color 0.15s, border-color 0.15s, filter 0.15s, opacity 0.15s; }
  /* the privacy row stays still — no global button grow/brighten/press */
  .ac-switch { -webkit-tap-highlight-color: transparent; }
  .ac-switch:hover, .ac-switch:active { transform: none !important; filter: none !important; }
  .ac-jump { -webkit-tap-highlight-color: transparent; transition: background-color 0.15s, color 0.15s, border-color 0.15s; }
  @media (hover: hover) {
    .ac-btn:hover:not(:disabled) { filter: brightness(1.12); transform: none; }
    .ac-btn.ghost:hover:not(:disabled) { background-color: rgba(255,255,255,0.12) !important; }
    .ac-jump:hover { color: white !important; border-color: rgba(255,255,255,0.25) !important; transform: none; filter: none; }
  }
`

const svg = (children, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const ICONS = {
  id: svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="9" cy="11" r="2.2" /><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4" /><line x1="14.5" y1="10" x2="18" y2="10" /><line x1="14.5" y1="13.5" x2="17" y2="13.5" /></>),
  key: svg(<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3" /><path d="M16 7l2.5 2.5" /><path d="M18.5 4.5L21 7" /></>),
  eye: svg(<><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  lockSmall: svg(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, 14),
  shield: svg(<><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
  warn: svg(<><path d="M12 3.5L2.5 20h19z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>),
  check: svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, 13),
  mail: svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>),
  clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>, 16),
  dot: svg(<circle cx="12" cy="12" r="3" fill="currentColor" />, 13),
}

const SECTIONS = [
  { id: 'details', label: 'Details' },
  { id: 'email', label: 'Email' },
  { id: 'password', label: 'Password' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'security', label: 'Security' },
  { id: 'delete', label: 'Delete' },
]

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'A number' },
]

const longDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null

function Section({ id, icon, title, subtitle, children, danger, delay = 0 }) {
  return (
    <section id={id} style={{
      scrollMarginTop: 'calc(var(--nav-h) + 1rem)',
      backgroundColor: danger ? 'rgba(179,31,47,0.05)' : 'rgba(255,255,255,0.035)',
      border: '1px solid ' + (danger ? 'rgba(220,60,79,0.3)' : 'rgba(255,255,255,0.08)'),
      borderRadius: '18px', padding: 'clamp(1.1rem, 3.5vw, 1.6rem)', animation: `acFadeIn 0.4s ease ${delay}s both`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1.2rem' }}>
        <span style={{
          flexShrink: 0, width: '38px', height: '38px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: danger ? '#ff6b7d' : '#ff8a97', backgroundColor: 'rgba(179,31,47,0.14)', border: '1px solid rgba(220,60,79,0.28)'
        }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: danger ? '#ff8a97' : 'white' }}>{title}</h2>
          {subtitle && <p style={{ margin: '0.2rem 0 0', color: '#999', fontSize: '0.83rem', lineHeight: 1.45 }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Button({ children, onClick, variant = 'primary', loading, disabled, type = 'button', style }) {
  const off = loading || disabled
  const look = variant === 'primary'
    ? { background: 'linear-gradient(135deg, #e0394f 0%, #b31f2f 100%)', border: '1px solid transparent', color: 'white', boxShadow: '0 4px 14px rgba(179,31,47,0.3)' }
    : variant === 'danger'
      ? { background: '#b31f2f', border: '1px solid #dc3c4f', color: 'white' }
      : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'white' }
  return (
    <button type={type} onClick={onClick} disabled={off} className={'ac-btn' + (variant === 'ghost' ? ' ghost' : '')} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      height: '44px', padding: '0 1.15rem', borderRadius: '12px', cursor: off ? 'default' : 'pointer',
      fontSize: '0.88rem', fontWeight: 700, opacity: off ? 0.55 : 1, ...look, ...style
    }}>
      {loading && <span style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', animation: 'acSpin 0.7s linear infinite' }} />}
      {children}
    </button>
  )
}

function InfoRow({ label, children, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      padding: '0.8rem 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)'
    }}>
      <span style={{ color: '#8a8a8a', fontSize: '0.83rem' }}>{label}</span>
      <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', overflowWrap: 'anywhere', minWidth: 0 }}>{children}</span>
    </div>
  )
}

function Badge({ ok, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem', verticalAlign: 'middle',
      padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.03em',
      color: ok ? '#4ade80' : '#fbbf24',
      backgroundColor: ok ? 'rgba(46,204,113,0.12)' : 'rgba(251,191,36,0.12)',
      border: '1px solid ' + (ok ? 'rgba(74,222,128,0.35)' : 'rgba(251,191,36,0.35)')
    }}>{ok ? ICONS.check : ICONS.dot}{children}</span>
  )
}

// 6-digit authenticator code, for when 2FA is on.
function CodeField({ value, onChange, status }) {
  return (
    <AuthField
      label="Authentication code"
      icon={ICONS.shield}
      type="text"
      name="twoFactorCode"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="6-digit code from your app"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      status={status}
      required
    />
  )
}

// ---------------------------------------------------------------------------

const shortTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null

// Change email: asks for the new address + current password (and 2FA code);
// the switch only happens once the link sent to the new address is opened.
function EmailSection({ user, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null) // 'send' | 'resend' | 'cancel'
  const [error, setError] = useState(null) // { message, field }
  const [notice, setNotice] = useState('')

  const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())
  const same = newEmail.trim().toLowerCase() === (user.email || '').toLowerCase()
  const ready = looksValid && !same && password && (!user.two_factor_enabled || code.length === 6)
  const expired = user.email_change_expires && new Date(user.email_change_expires) < new Date()

  const reset = () => { setNewEmail(''); setPassword(''); setCode(''); setShowPassword(false); setError(null) }

  const send = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy('send'); setError(null); setNotice('')
    try {
      const res = await api.post('/user/account/email', { newEmail: newEmail.trim(), password, twoFactorCode: code || undefined })
      onUpdate(res.data)
      reset()
      setOpen(false)
    } catch (err) {
      setError({ message: err.response?.data?.message || 'Could not start the email change', field: err.response?.data?.field })
    } finally {
      setBusy(null)
    }
  }

  const resend = async () => {
    setBusy('resend'); setError(null); setNotice('')
    try {
      const res = await api.post('/user/account/email/resend')
      onUpdate(res.data)
      setNotice(`New link sent to ${res.data.pending_email}. Older links no longer work.`)
    } catch (err) {
      setError({ message: err.response?.data?.message || 'Could not resend the link' })
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    setBusy('cancel'); setError(null); setNotice('')
    try {
      await api.delete('/user/account/email/pending')
      onUpdate({ pending_email: null, email_change_expires: null })
    } catch (err) {
      setError({ message: err.response?.data?.message || 'Could not cancel the change' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Section id="email" icon={ICONS.mail} title="Email address" delay={0.03}
      subtitle="Where we send sign-in, security and password-reset emails.">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, overflowWrap: 'anywhere', minWidth: 0 }}>
          {user.email}
          <Badge ok={user.email_verified}>{user.email_verified ? 'Verified' : 'Not verified'}</Badge>
        </span>
      </div>

      {error && <AuthAlert key={error.message}>{error.message}</AuthAlert>}
      {notice && <AuthAlert kind="success" key={notice}>{notice}</AuthAlert>}

      {user.pending_email ? (
        // waiting for the new address to be confirmed
        <div style={{
          padding: '0.95rem 1rem', borderRadius: '14px', backgroundColor: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)'
        }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0, color: '#fcd34d', fontWeight: 700, fontSize: '0.88rem' }}>
            {ICONS.clock} {expired ? 'Confirmation link expired' : 'Waiting for confirmation'}
          </p>
          <p style={{ margin: '0.4rem 0 0', color: '#bbb', fontSize: '0.83rem', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
            {expired
              ? <>The link we sent to <strong style={{ color: 'white' }}>{user.pending_email}</strong> has expired. Send a new one, or cancel the change.</>
              : <>We sent a link to <strong style={{ color: 'white' }}>{user.pending_email}</strong>. Open it to finish the change{user.email_change_expires ? <> — it works until {shortTime(user.email_change_expires)}</> : null}. Until then you keep using your current email.</>}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            <Button onClick={resend} loading={busy === 'resend'} disabled={Boolean(busy)}>{busy === 'resend' ? 'Sending…' : 'Resend link'}</Button>
            <Button variant="ghost" onClick={cancel} loading={busy === 'cancel'} disabled={Boolean(busy)}>Cancel change</Button>
          </div>
        </div>
      ) : !open ? (
        <Button variant="ghost" onClick={() => { setNotice(''); setOpen(true) }}>Change email</Button>
      ) : (
        <form onSubmit={send} style={{ animation: 'acFadeIn 0.25s ease both' }}>
          <AuthField label="New email address" icon={ICONS.mail} type="email" name="new-email" autoComplete="email"
            placeholder="you@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required autoFocus
            status={error?.field === 'newEmail' || (newEmail && same) ? 'error' : undefined}
            hint={newEmail && same ? 'That is already your email' : null}
            style={{ marginBottom: '1rem' }} />
          <AuthField label="Current password" icon={AUTH_ICONS.lock} type={showPassword ? 'text' : 'password'} name="email-change-password"
            autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required
            status={error?.field === 'password' ? 'error' : undefined}
            rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
            style={{ marginBottom: user.two_factor_enabled ? '1rem' : 0 }} />
          {user.two_factor_enabled && (
            <CodeField value={code} onChange={setCode} status={error?.field === 'twoFactorCode' ? 'error' : undefined} />
          )}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.3rem' }}>
            <Button type="submit" loading={busy === 'send'} disabled={!ready}>{busy === 'send' ? 'Sending…' : 'Send confirmation link'}</Button>
            <Button variant="ghost" onClick={() => { reset(); setOpen(false) }} disabled={Boolean(busy)}>Cancel</Button>
          </div>
          <p style={{ color: '#777', fontSize: '0.75rem', margin: '0.9rem 0 0', lineHeight: 1.5 }}>
            We'll email a link to the new address — the change only happens once you open it. Your current address gets a heads-up too.
          </p>
        </form>
      )}
    </Section>
  )
}

function PasswordSection({ user, onChanged }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null) // { message, field }
  const [done, setDone] = useState(false)

  const rules = PASSWORD_RULES.map(r => ({ ...r, ok: r.test(next) }))
  const sameAsCurrent = next && current && next === current
  const allGood = rules.every(r => r.ok) && !sameAsCurrent && confirm === next && current && (!user.two_factor_enabled || code.length === 6)

  const reset = () => {
    setCurrent(''); setNext(''); setConfirm(''); setCode('')
    setShow({ current: false, next: false, confirm: false }); setError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!allGood) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.post('/user/account/password', { currentPassword: current, newPassword: next, twoFactorCode: code || undefined })
      // this session continues with the fresh tokens; other devices are signed out
      const stored = JSON.parse(localStorage.getItem('user'))
      if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, token: res.data.token, refreshToken: res.data.refreshToken }))
      onChanged(res.data.password_changed_at)
      reset()
      setOpen(false)
      setDone(true)
    } catch (err) {
      setError({ message: err.response?.data?.message || 'Could not change your password', field: err.response?.data?.field })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (k) => <PasswordToggle visible={show[k]} onToggle={() => setShow(s => ({ ...s, [k]: !s[k] }))} />

  return (
    <Section id="password" icon={ICONS.key} title="Password" delay={0.05}
      subtitle={user.password_changed_at ? `Last changed on ${longDate(user.password_changed_at)}` : 'Use a strong password you don’t use anywhere else.'}>
      {done && !open && (
        <AuthAlert kind="success">Password changed. You've been signed out on your other devices, and we've emailed you a confirmation.</AuthAlert>
      )}

      {!open ? (
        <Button variant="ghost" onClick={() => { setDone(false); setOpen(true) }}>Change password</Button>
      ) : (
        <form onSubmit={submit} style={{ animation: 'acFadeIn 0.25s ease both' }}>
          {error && <AuthAlert key={error.message}>{error.message}</AuthAlert>}

          <AuthField label="Current password" icon={AUTH_ICONS.lock} type={show.current ? 'text' : 'password'} name="current-password"
            autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required
            status={error?.field === 'currentPassword' ? 'error' : undefined} rightSlot={toggle('current')} style={{ marginBottom: '1rem' }} />

          <AuthField label="New password" icon={AUTH_ICONS.lock} type={show.next ? 'text' : 'password'} name="new-password"
            autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required
            passwordrules="minlength: 8; required: upper; required: lower; required: digit;"
            status={error?.field === 'newPassword' || sameAsCurrent ? 'error' : undefined}
            hint={sameAsCurrent ? 'Must be different from your current password' : null}
            rightSlot={toggle('next')} />

          {/* What the new password still needs, ticked off as you type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.3rem 0.8rem', margin: '0.65rem 0 1rem' }}>
            {rules.map(r => (
              <span key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 600, color: r.ok ? '#4ade80' : '#777', transition: 'color 0.2s' }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: r.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'
                }}>{r.ok ? ICONS.check : null}</span>
                {r.label}
              </span>
            ))}
          </div>

          <AuthField label="Confirm new password" icon={AUTH_ICONS.lock} type={show.confirm ? 'text' : 'password'} name="confirm-password"
            autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            status={confirm ? (confirm === next ? 'ok' : 'error') : undefined}
            hint={confirm ? (confirm === next ? '✓ Passwords match' : "Passwords don't match yet") : null}
            rightSlot={toggle('confirm')} style={{ marginBottom: user.two_factor_enabled ? '1rem' : 0 }} />

          {user.two_factor_enabled && (
            <CodeField value={code} onChange={setCode} status={error?.field === 'twoFactorCode' ? 'error' : undefined} />
          )}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.3rem' }}>
            <Button type="submit" loading={saving} disabled={!allGood}>{saving ? 'Saving…' : 'Update password'}</Button>
            <Button variant="ghost" onClick={() => { reset(); setOpen(false) }} disabled={saving}>Cancel</Button>
          </div>
          <p style={{ color: '#777', fontSize: '0.75rem', margin: '0.9rem 0 0', lineHeight: 1.5 }}>
            For your security, this signs you out on your other devices and sends a confirmation email.
          </p>
        </form>
      )}
    </Section>
  )
}

function PrivacySection({ user, onChange }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const on = Boolean(user.is_private)

  const flip = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await api.patch('/user/account/privacy', { is_private: !on })
      onChange(res.data.is_private)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your privacy setting')
    } finally {
      setSaving(false)
    }
  }

  const visible = [
    ['Your name and photo', true],
    ['Watched movies, ratings & dates', !on],
    ['Watchlist and favorites', !on],
    ['Your logs & threads in the community feed', !on],
  ]

  return (
    <Section id="privacy" icon={ICONS.eye} title="Privacy" delay={0.1}
      subtitle="Choose what other CineLog members can see on your profile.">
      {error && <AuthAlert key={error}>{error}</AuthAlert>}

      <button type="button" role="switch" aria-checked={on} className="ac-switch" onClick={flip} disabled={saving} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', cursor: saving ? 'default' : 'pointer',
        textAlign: 'left', backgroundColor: on ? 'rgba(179,31,47,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid ' + (on ? 'rgba(220,60,79,0.45)' : 'rgba(255,255,255,0.1)'), transition: 'background-color 0.2s, border-color 0.2s'
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
            {on && <span style={{ color: '#ff6b7d', display: 'flex' }}>{ICONS.lockSmall}</span>}
            Private account
          </span>
          <span style={{ display: 'block', color: '#999', fontSize: '0.8rem', marginTop: '0.2rem', lineHeight: 1.4 }}>
            {on ? 'Only you can see your lists and activity.' : 'Anyone on CineLog can see your lists and activity.'}
          </span>
        </span>
        {/* the switch */}
        <span aria-hidden="true" style={{
          position: 'relative', flexShrink: 0, width: '48px', height: '28px', borderRadius: '999px',
          backgroundColor: on ? '#dc3c4f' : 'rgba(255,255,255,0.15)', transition: 'background-color 0.2s', opacity: saving ? 0.6 : 1
        }}>
          <span style={{
            position: 'absolute', top: '3px', left: on ? '23px' : '3px', width: '22px', height: '22px', borderRadius: '50%',
            backgroundColor: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </span>
      </button>

      <p style={{ color: '#888', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '1.2rem 0 0.6rem' }}>
        What other people see
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {visible.map(([label, shown]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: shown ? '#ddd' : '#777' }}>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: shown ? '#4ade80' : '#ff6b7d', backgroundColor: shown ? 'rgba(74,222,128,0.12)' : 'rgba(179,31,47,0.14)'
            }}>{shown ? ICONS.check : ICONS.lockSmall}</span>
            <span style={{ textDecoration: shown ? 'none' : 'line-through', textDecorationColor: 'rgba(255,255,255,0.25)' }}>{label}</span>
          </div>
        ))}
      </div>
      {on && (
        <p style={{ color: '#999', fontSize: '0.78rem', margin: '1rem 0 0', lineHeight: 1.5 }}>
          People who find you in search will see that your account is private.
        </p>
      )}
    </Section>
  )
}

function DeleteAccountModal({ user, onClose }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const ready = password && typed === user.username && (!user.two_factor_enabled || code.length === 6)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [deleting, onClose])

  const submit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setDeleting(true)
    setError('')
    try {
      await api.delete('/user/profile', { data: { password, twoFactorCode: code || undefined } })
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete your account')
      setDeleting(false)
    }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'acFadeIn 0.2s ease'
    }}>
      <form role="dialog" aria-modal="true" aria-labelledby="delete-title" onSubmit={submit} style={{
        width: '100%', maxWidth: '440px', maxHeight: '92dvh', overflowY: 'auto', boxSizing: 'border-box',
        background: 'linear-gradient(160deg, #1d1d1d 0%, #131313 100%)', border: '1px solid rgba(220,60,79,0.35)',
        borderRadius: '20px', padding: 'clamp(1.2rem, 4vw, 1.75rem)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        animation: 'acPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: '56px', height: '56px', margin: '0 auto 0.9rem', borderRadius: '50%', color: '#ff6b7d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(179,31,47,0.15)', border: '1px solid rgba(220,60,79,0.4)'
        }}>{ICONS.warn}</div>
        <h2 id="delete-title" style={{ textAlign: 'center', margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800 }}>Delete your account?</h2>
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.86rem', margin: '0 0 1.1rem', lineHeight: 1.5 }}>
          This permanently deletes your profile, watched movies, ratings, watchlist, favorites and comments. <strong style={{ color: 'white' }}>It can't be undone.</strong>
        </p>

        {error && <AuthAlert key={error}>{error}</AuthAlert>}

        <AuthField label="Your password" icon={AUTH_ICONS.lock} type={showPassword ? 'text' : 'password'} name="delete-password"
          autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus
          rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />} style={{ marginBottom: '1rem' }} />

        {user.two_factor_enabled && (
          <div style={{ marginBottom: '1rem' }}><CodeField value={code} onChange={setCode} /></div>
        )}

        <AuthField
          label={<>Type <strong style={{ color: 'white' }}>{user.username}</strong> to confirm</>}
          type="text" name="delete-confirm" autoComplete="off" spellCheck={false}
          value={typed} onChange={(e) => setTyped(e.target.value)}
          status={typed ? (typed === user.username ? 'ok' : 'error') : undefined}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '1.3rem' }}>
          <Button type="submit" variant="danger" loading={deleting} disabled={!ready} style={{ width: '100%' }}>
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={deleting} style={{ width: '100%' }}>Keep my account</Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Account() {
  const [user, setUser] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  useEffect(() => {
    api.get('/user/profile')
      .then(res => setUser(res.data))
      .catch(() => setLoadError('Could not load your account. Please try again.'))
  }, [])

  const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <style>{styles}</style>
      <Navbar>
        <BackButton onClick={() => navigate('/profile')}>Back to Profile</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '760px', margin: '0 auto', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: isMobile ? '1rem' : '1.4rem' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: '0 0 0.35rem 0', color: '#dc3c4f', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            <span style={{ width: '3px', height: '0.8rem', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
            Settings
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 6vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>My account</h1>
          <p style={{ margin: '0.3rem 0 0', color: '#999', fontSize: '0.9rem' }}>Check your details and manage your password, privacy and security.</p>
        </div>

        {/* Quick links to each section */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none', margin: '0 0 1.1rem', paddingBottom: '0.2rem' }}>
          {SECTIONS.map(s => (
            <button key={s.id} type="button" className="ac-jump" onClick={() => jumpTo(s.id)} style={{
              flexShrink: 0, padding: '0.4rem 0.85rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid ' + (s.id === 'delete' ? 'rgba(220,60,79,0.35)' : 'rgba(255,255,255,0.1)'),
              color: s.id === 'delete' ? '#ff8a97' : '#bbb'
            }}>{s.label}</button>
          ))}
        </div>

        {loadError && <AuthAlert>{loadError}</AuthAlert>}

        {!user ? (
          !loadError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[220, 140, 260].map((h, i) => <div key={i} style={{ height: h, borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', animation: 'acPulse 1.3s ease-in-out infinite' }} />)}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.9rem' : '1.1rem' }}>

            {/* ---------- Details ---------- */}
            <Section id="details" icon={ICONS.id} title="Account details" subtitle="Make sure this information is correct.">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.9rem', marginBottom: '0.4rem', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(179,31,47,0.14) 0%, rgba(255,255,255,0.02) 70%)', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ borderRadius: '50%', boxShadow: '0 4px 14px rgba(179,31,47,0.35)', flexShrink: 0 }}><Avatar user={user} size={56} /></div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', overflowWrap: 'anywhere' }}>
                    {user.username}
                    {user.is_private && <span style={{ marginLeft: '0.45rem', color: '#ff6b7d', verticalAlign: 'middle', display: 'inline-flex' }} title="Private account">{ICONS.lockSmall}</span>}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', color: '#999', fontSize: '0.8rem', overflowWrap: 'anywhere' }}>{user.email}</p>
                </div>
              </div>
              <InfoRow label="Username">{user.username}</InfoRow>
              <InfoRow label="Email">
                {user.email}
                {user.pending_email && <Badge ok={false}>Change pending</Badge>}
                <Badge ok={user.email_verified}>{user.email_verified ? 'Verified' : 'Not verified'}</Badge>
              </InfoRow>
              <InfoRow label="Member since">{longDate(user.createdAt)}</InfoRow>
              <InfoRow label="Profile">{user.is_private ? 'Private' : 'Public'}</InfoRow>
              <InfoRow label="Two-factor authentication" last>
                <Badge ok={user.two_factor_enabled}>{user.two_factor_enabled ? 'On' : 'Off'}</Badge>
              </InfoRow>
            </Section>

            {/* ---------- Email ---------- */}
            <EmailSection user={user} onUpdate={(patch) => setUser(u => ({ ...u, ...patch }))} />

            {/* ---------- Password ---------- */}
            <PasswordSection user={user} onChanged={(at) => setUser(u => ({ ...u, password_changed_at: at }))} />

            {/* ---------- Privacy ---------- */}
            <PrivacySection user={user} onChange={(isPrivate) => setUser(u => ({ ...u, is_private: isPrivate }))} />

            {/* ---------- Security ---------- */}
            <Section id="security" icon={ICONS.shield} title="Two-factor authentication" delay={0.15}
              subtitle="Ask for a code from your authenticator app whenever you sign in.">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.88rem', color: '#ccc' }}>
                  Status: <Badge ok={user.two_factor_enabled}>{user.two_factor_enabled ? 'On' : 'Off'}</Badge>
                </span>
                <Button variant={user.two_factor_enabled ? 'ghost' : 'primary'} onClick={() => setShow2FA(true)}>
                  {user.two_factor_enabled ? 'Manage 2FA' : 'Turn on 2FA'}
                </Button>
              </div>
            </Section>

            {/* ---------- Delete ---------- */}
            <Section id="delete" icon={ICONS.warn} title="Delete account" danger delay={0.2}
              subtitle="Permanently remove your account and everything in it. You'll be asked for your password first.">
              <Button variant="danger" onClick={() => setShowDelete(true)}>Delete my account…</Button>
            </Section>
          </div>
        )}
      </div>

      {show2FA && user && (
        <TwoFactorSetup
          onClose={() => setShow2FA(false)}
          isEnabled={user.two_factor_enabled}
          onEnabled={() => setUser(u => ({ ...u, two_factor_enabled: true }))}
          onDisabled={() => setUser(u => ({ ...u, two_factor_enabled: false }))}
        />
      )}

      {showDelete && user && <DeleteAccountModal user={user} onClose={() => setShowDelete(false)} />}
    </div>
  )
}

export default Account
