import { useState } from 'react'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'

function TwoFactorSetup({ onClose, onEnabled, onDisabled, isEnabled }) {
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile()

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (e.g. insecure context) — the key is still
      // selectable on screen, so there's nothing else to do.
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    try {
      const res = await api.post('/2fa/setup')
      setQrCode(res.data.qrCode)
      setSecret(res.data.secret)
      setStep(2)
    } catch (err) {
      setError('Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/2fa/verify', { token: code })
      setStep(3)
      onEnabled()
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await api.post('/2fa/disable')
      onDisabled()
      onClose()
    } catch (err) {
      setError('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const primaryButton = (disabled) => ({
    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '12px',
    background: 'linear-gradient(135deg, #d23046 0%, #b31f2f 100%)',
    color: 'white', fontSize: '1rem', fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
    boxShadow: '0 4px 14px rgba(179,31,47,0.3)', transition: 'opacity 0.15s'
  })

  const bodyText = { color: '#aaa', margin: 0, fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: 1.55, textAlign: 'center' }

  // Which of the three setup steps is active (not shown when 2FA is
  // already on — that view is just a status + a Disable button).
  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: isMobile ? '1rem' : '1.25rem' }}>
      {['Start', 'Scan', 'Done'].map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'active' : 'todo'
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {i > 0 && <span style={{ width: isMobile ? '18px' : '28px', height: '2px', borderRadius: '1px', backgroundColor: n <= step ? '#b31f2f' : 'rgba(255,255,255,0.12)' }} />}
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800,
              backgroundColor: state === 'todo' ? 'rgba(255,255,255,0.08)' : '#b31f2f',
              color: state === 'todo' ? '#777' : 'white'
            }}>{state === 'done' ? '✓' : n}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: state === 'active' ? 'white' : '#777' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, padding: '1rem', boxSizing: 'border-box'
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #1f1f1f 0%, #151515 100%)',
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: '440px',
        // dvh + its own scroll: on a short or sideways phone (or with the
        // keyboard open) the modal scrolls instead of running off-screen.
        maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.65)'
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-80px', right: '-80px', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.22) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        {/* Header — stays put while the body scrolls */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: isMobile ? '1rem 1rem 0.9rem' : '1.25rem 1.5rem 1.1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0
        }}>
          <span style={{
            flexShrink: 0, width: '38px', height: '38px', borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            backgroundColor: 'rgba(179,31,47,0.16)', border: '1px solid rgba(179,31,47,0.35)'
          }}>🔐</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 800, lineHeight: 1.2 }}>Two-Factor Authentication</h2>
            <p style={{ color: isEnabled ? '#00c800' : '#888', margin: '0.15rem 0 0 0', fontSize: '0.78rem', fontWeight: 600 }}>
              {isEnabled ? 'Enabled' : 'Extra security for your account'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%', padding: 0,
              backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'white', fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ position: 'relative', overflowY: 'auto', overscrollBehavior: 'contain', padding: isMobile ? '1.1rem 1rem 1.25rem' : '1.5rem' }}>
          {error && (
            <p style={{ color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(179,31,47,0.25)', padding: '0.65rem', borderRadius: '10px', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}

          {isEnabled ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>✅</p>
              <p style={{ color: '#00c800', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>2FA is currently enabled</p>
              <p style={{ ...bodyText, marginBottom: '1.25rem' }}>
                Your account is protected with two-factor authentication.
              </p>
              <button onClick={handleDisable} disabled={loading} style={primaryButton(loading)}>
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          ) : (
            <>
              {stepIndicator}

              {step === 1 && (
                <div>
                  <p style={{ ...bodyText, marginBottom: '1.25rem' }}>
                    Two-Factor Authentication adds an extra layer of security. You'll need Google Authenticator or a similar app.
                  </p>
                  <button onClick={handleSetup} disabled={loading} style={primaryButton(loading)}>
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p style={{ ...bodyText, marginBottom: '0.9rem' }}>
                    Scan this QR code with your authenticator app
                  </p>
                  {qrCode && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
                      {/* White frame: QR scanners need a light quiet zone
                          around the code. Shrinks on narrow/short screens. */}
                      <div style={{ padding: '8px', borderRadius: '14px', backgroundColor: 'white', lineHeight: 0 }}>
                        <img src={qrCode} alt="QR Code" style={{ width: 'min(190px, 50vw, 28dvh)', height: 'min(190px, 50vw, 28dvh)', display: 'block', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  )}

                  <p style={{ color: '#888', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.4rem 0', textAlign: 'center' }}>
                    Or enter this key manually
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '0.5rem 0.5rem 0.5rem 0.75rem'
                  }}>
                    <code style={{ flex: 1, minWidth: 0, color: 'white', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '0.78rem', lineHeight: 1.4, overflowWrap: 'anywhere', userSelect: 'all' }}>
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      style={{
                        flexShrink: 0, padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: copied ? 'rgba(0,200,0,0.15)' : 'rgba(255,255,255,0.08)',
                        border: '1px solid ' + (copied ? 'rgba(0,200,0,0.4)' : 'rgba(255,255,255,0.15)'),
                        color: copied ? '#00c800' : 'white', fontSize: '0.75rem', fontWeight: 700
                      }}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <form onSubmit={handleVerify}>
                    <label style={{ color: '#888', display: 'block', marginBottom: '0.45rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
                      Enter the 6-digit code
                    </label>
                    <input
                      type="text"
                      className="code-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      placeholder="000000"
                      required
                      // No autofocus on phones: it would pop the keyboard up
                      // over the QR code before you've had a chance to scan it.
                      autoFocus={!isMobile}
                      style={{
                        width: '100%', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem',
                        border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'white', boxSizing: 'border-box', fontSize: '1.5rem', fontWeight: 700,
                        // The trailing letter-space would push the digits left of
                        // centre; the matching left padding puts them back.
                        textAlign: 'center', letterSpacing: '0.5rem', paddingLeft: 'calc(0.75rem + 0.5rem)', outline: 'none'
                      }}
                    />
                    <button type="submit" disabled={loading || code.length < 6} style={primaryButton(loading || code.length < 6)}>
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </form>
                </div>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2.6rem', margin: '0 0 0.6rem 0' }}>✅</p>
                  <h3 style={{ color: 'white', margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 800 }}>2FA Enabled!</h3>
                  <p style={{ ...bodyText, marginBottom: '1.25rem' }}>Your account is now protected.</p>
                  <button onClick={onClose} style={primaryButton(false)}>
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorSetup