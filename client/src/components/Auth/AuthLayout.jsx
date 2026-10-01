// The shared frame for the sign-in pages: the drifting poster wall behind,
// a way back home, and the card. With `aside`, wide screens get a split card
// (CineLog's pitch on the left, the form on the right); phones always get
// just the form.
import { useNavigate } from 'react-router-dom'
import PosterBackdrop from '../UI/PosterBackdrop'
import BackButton from '../UI/BackButton'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import { AUTH_ICONS, svg } from './authIcons'

const styles = `
  @keyframes authCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
  @keyframes authSpin { to { transform: rotate(360deg); } }
  @keyframes authShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-3px); } 40%, 60% { transform: translateX(3px); } }
  .auth-shell { display: grid; grid-template-columns: minmax(0, 1fr); }
  .auth-aside { display: none; }
  @media (min-width: 900px) {
    .auth-shell.split { grid-template-columns: minmax(0, 1fr) minmax(0, var(--form-w)); }
    .auth-shell.split .auth-aside { display: flex; }
    .auth-shell.split .auth-form-logo { display: none !important; }
  }
  .auth-link { background: none; border: none; padding: 0; font: inherit; color: #ff5a6c; font-weight: 700; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .auth-btn { -webkit-tap-highlight-color: transparent; transition: box-shadow 0.15s, transform 0.15s, filter 0.15s; }
  .auth-btn:active:not(:disabled) { transform: scale(0.98); }
  @media (hover: hover) {
    .auth-link:hover { color: #ff8a97; text-decoration: underline; text-underline-offset: 3px; transform: none; filter: none; }
    .auth-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 10px 26px rgba(179,31,47,0.5) !important; transform: translateY(-1px); }
  }
`

const FEATURES = [
  { icon: svg(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><line x1="7.5" y1="4" x2="7.5" y2="20" /><line x1="16.5" y1="4" x2="16.5" y2="20" /></>), title: 'Log every film', text: 'Rate it, date it, remember it.' },
  { icon: svg(<path d="M6 3.5h12v17l-6-4-6 4z" />), title: 'Build your watchlist', text: 'Never lose track of what’s next.' },
  { icon: svg(<><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.9-3.3 3.3-5 6.5-5s5.6 1.7 6.5 5" /><circle cx="17" cy="9.5" r="2.7" /><path d="M17.5 14.6c2.2.3 3.6 1.9 4.1 4.4" /></>), title: 'Join the conversation', text: 'See what everyone thinks.' },
]

const FAN = [
  'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  'https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
]

function Aside() {
  return (
    <div className="auth-aside" style={{
      position: 'relative', overflow: 'hidden', flexDirection: 'column', padding: '2.5rem 2.25rem 0',
      background: 'linear-gradient(160deg, rgba(179,31,47,0.32) 0%, rgba(60,10,16,0.55) 45%, rgba(12,12,12,0.6) 100%)',
      borderRight: '1px solid rgba(255,255,255,0.07)'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-120px', left: '-120px', width: '360px', height: '360px',
        background: 'radial-gradient(circle, rgba(220,60,79,0.35) 0%, transparent 65%)', pointerEvents: 'none'
      }} />
      <img src="/logo.png" alt="CineLog" style={{ position: 'relative', height: '56px', width: 'fit-content', objectFit: 'contain' }} />
      <h2 style={{ position: 'relative', margin: '1.6rem 0 0.5rem', fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'white' }}>
        Your movie life,<br />all in one place.
      </h2>
      <p style={{ position: 'relative', margin: '0 0 1.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', lineHeight: 1.5 }}>
        The diary for everything you watch.
      </p>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span style={{
              flexShrink: 0, width: '38px', height: '38px', borderRadius: '11px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)'
            }}>{f.icon}</span>
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</p>
              <p style={{ margin: '0.1rem 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* A little fan of posters peeking up from the bottom */}
      <div aria-hidden="true" style={{ position: 'relative', flex: 1, minHeight: '150px', marginTop: '1.5rem' }}>
        {FAN.map((src, i) => (
          <img key={src} src={src} alt="" style={{
            position: 'absolute', bottom: '-48px', left: `${18 + i * 22}%`, width: '34%', aspectRatio: '2 / 3', objectFit: 'cover',
            borderRadius: '10px', boxShadow: '0 14px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
            transform: `rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -14 : 0}px)`, zIndex: i === 1 ? 2 : 1
          }} />
        ))}
      </div>
    </div>
  )
}

export default function AuthLayout({ children, aside = false, formWidth = '420px', backLabel = 'Home', onBack }) {
  const navigate = useNavigate()
  return (
    <div style={{
      // svh + padding: the card is centred in the part of the screen that's
      // actually visible on a phone, and never touches the screen edges.
      minHeight: '100svh', backgroundColor: '#0a0a0a', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '4.5rem 1rem 1.75rem', overflow: 'hidden', position: 'relative'
    }}>
      <style>{styles}</style>
      <PosterBackdrop
        opacity={0.24}
        overlay="radial-gradient(ellipse 80% 60% at 50% 50%, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.74) 60%, rgba(8,8,8,0.6) 100%)"
      />
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(900px, 140vw)', height: 'min(900px, 140vw)', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(179,31,47,0.2) 0%, transparent 62%)'
      }} />

      <BackButton onClick={onBack || (() => navigate('/'))} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 11 }}>
        {backLabel}
      </BackButton>

      <div className={'auth-shell' + (aside ? ' split' : '')} style={{
        '--form-w': formWidth,
        position: 'relative', zIndex: 10, overflow: 'hidden', width: '100%',
        maxWidth: aside ? `calc(${formWidth} + 400px)` : formWidth,
        background: 'linear-gradient(160deg, rgba(28,28,28,0.93) 0%, rgba(13,13,13,0.94) 100%)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
        boxShadow: '0 30px 70px rgba(0,0,0,0.65)',
        animation: 'authCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}>
        {aside && <Aside />}
        <div style={{ position: 'relative', padding: 'var(--card-pad)', minWidth: 0 }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-80px', right: '-80px', width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(179,31,47,0.22) 0%, transparent 70%)', pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative' }}>{children}</div>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

// Logo (only when the split panel isn't showing it), title and a line under it.
// badge: an icon in a red circle, instead of the logo.
export function AuthHeader({ title, subtitle, badge, onLogoClick }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
      {badge ? (
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 1.1rem', borderRadius: '50%', color: '#ff6b7d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(179,31,47,0.14)', border: '1px solid rgba(220,60,79,0.35)',
          boxShadow: '0 0 0 8px rgba(179,31,47,0.06)'
        }}>{badge}</div>
      ) : (
        <div className="auth-form-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
          <img src="/logo.png" alt="CineLog" onClick={onLogoClick} style={{ height: '62px', objectFit: 'contain', cursor: onLogoClick ? 'pointer' : 'default' }} />
        </div>
      )}
      <h1 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle && <p style={{ color: '#999', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  )
}

// error / success message with an icon. Re-shakes whenever the text changes.
export function AuthAlert({ kind = 'error', children }) {
  const ok = kind === 'success'
  return (
    <div key={String(children)} role={ok ? 'status' : 'alert'} style={{
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.75rem 0.85rem', borderRadius: '12px',
      marginBottom: '1.1rem', fontSize: '0.86rem', lineHeight: 1.45,
      color: ok ? '#86efac' : '#ff8a97',
      backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(179,31,47,0.12)',
      border: '1px solid ' + (ok ? 'rgba(74,222,128,0.3)' : 'rgba(220,60,79,0.35)'),
      animation: ok ? 'authCardIn 0.3s ease both' : 'authShake 0.4s ease both'
    }}>
      <span style={{ display: 'flex', flexShrink: 0, marginTop: '1px' }}>{ok ? AUTH_ICONS.check : AUTH_ICONS.alert}</span>
      <span>{children}</span>
    </div>
  )
}

export function AuthButton({ children, loading, loadingText, disabled, ...rest }) {
  const off = loading || disabled
  return (
    <button type="submit" className="auth-btn" disabled={off} style={{
      width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
      background: 'linear-gradient(135deg, #e0394f 0%, #b31f2f 100%)', color: 'white', border: 'none', borderRadius: '14px',
      cursor: off ? 'default' : 'pointer', fontSize: '1rem', fontWeight: 700, opacity: off ? 0.7 : 1,
      boxShadow: '0 6px 18px rgba(179,31,47,0.35)'
    }} {...rest}>
      {loading
        ? <><span style={{ width: '17px', height: '17px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', animation: 'authSpin 0.7s linear infinite' }} />{loadingText || children}</>
        : <>{children}<span style={{ display: 'flex' }}>{AUTH_ICONS.arrow}</span></>}
    </button>
  )
}

// "Don't have an account? Create one" under a divider.
export function AuthFooter({ children }) {
  return (
    <p style={{ color: '#999', textAlign: 'center', margin: '1.5rem 0 0', paddingTop: '1.35rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' }}>
      {children}
    </p>
  )
}
