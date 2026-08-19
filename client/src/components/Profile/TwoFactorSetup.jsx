import { useState } from 'react'
import api from '../../api/axios'

function TwoFactorSetup({ onClose, onEnabled, onDisabled, isEnabled }) {
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px',
        width: '90%', maxWidth: '700px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>🔐 Two-Factor Authentication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {error && <p style={{ color: '#b31f2f', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

        {isEnabled ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#00c800', fontSize: '1.2rem', marginBottom: '1rem' }}>✅ 2FA is currently enabled</p>
            <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
              Your account is protected with two-factor authentication.
            </p>
            <button
              onClick={handleDisable}
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', backgroundColor: '#b31f2f',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
              }}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
                  Two-Factor Authentication adds an extra layer of security. You'll need Google Authenticator or a similar app.
                </p>
                <button
                  onClick={handleSetup}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '0.75rem', backgroundColor: '#b31f2f',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ color: '#aaa', marginBottom: '1rem', textAlign: 'center' }}>
                  Scan this QR code with your authenticator app
                </p>
                {qrCode && (
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img src={qrCode} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '8px' }} />
                  </div>
                )}
                <p style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  Or enter manually: <strong style={{ color: 'white', wordBreak: 'break-all', fontSize: '0.75rem' }}>{secret}</strong>
                </p>
                <form onSubmit={handleVerify}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Enter the 6-digit code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                      required
                      autoFocus
                      style={{
                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'white', boxSizing: 'border-box', fontSize: '1.5rem',
                        textAlign: 'center', letterSpacing: '0.5rem', outline: 'none'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#b31f2f',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</p>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>2FA Enabled!</h3>
                <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Your account is now protected.</p>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '0.75rem', backgroundColor: '#b31f2f',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TwoFactorSetup