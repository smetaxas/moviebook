import useIsMobile from '../../hooks/useIsMobile'

// Every "go back" control in the app, so they all look and behave the same:
//  - variant "pill" (default): navbar back buttons and the floating "Home"
//    buttons on the auth pages — a glass pill with a round chevron badge;
//  - variant "link": inline text links such as "Back to Login".
// Hover effects live in CSS under (hover: hover), not in JS state, so a tap
// on a phone never leaves the button stuck in its hovered look.

const Chevron = ({ size }) => (
  <svg className="back-btn-chevron" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

const styles = `
  .back-btn, .back-link { -webkit-tap-highlight-color: transparent; }
  .back-btn { transition: background-color 0.18s, border-color 0.18s, box-shadow 0.18s; }
  .back-btn-badge { transition: background-color 0.18s, color 0.18s, box-shadow 0.18s; }
  .back-btn-chevron { transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
  .back-link { transition: color 0.15s; }
  .back-btn:active .back-btn-chevron, .back-link:active .back-btn-chevron { transform: translateX(-3px); }
  @media (hover: hover) {
    /* Opt out of the global button:hover zoom — the chevron nudge is this
       button's hover cue, and a growing pill next to the logo looks jumpy. */
    .back-btn:hover { transform: none; filter: none; background-color: rgba(255,255,255,0.11) !important; border-color: rgba(220,60,79,0.55) !important; box-shadow: 0 4px 16px rgba(179,31,47,0.22); }
    .back-btn:hover .back-btn-badge { background-color: #b31f2f !important; color: white !important; box-shadow: 0 2px 10px rgba(179,31,47,0.5); }
    .back-btn:hover .back-btn-chevron, .back-link:hover .back-btn-chevron { transform: translateX(-2px); }
    .back-link:hover { color: #ff6b7d !important; transform: none; filter: none; }
  }
`

function BackButton({ onClick, children = 'Back', variant = 'pill', style }) {
  const isMobile = useIsMobile()

  if (variant === 'link') {
    return (
      <>
      <style>{styles}</style>
      <button
        type="button"
        className="back-link"
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          background: 'none', border: 'none', padding: '0.25rem 0.1rem',
          color: '#dc3c4f', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
          ...style
        }}
      >
        <Chevron size={15} />
        {children}
      </button>
      </>
    )
  }

  const badge = isMobile ? 24 : 26

  return (
    <>
    <style>{styles}</style>
    <button
      type="button"
      className="back-btn"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.6rem',
        // Tighter on the badge side so the circle sits snug in the pill's curve.
        padding: isMobile ? '0.3rem 0.85rem 0.3rem 0.3rem' : '0.35rem 1.05rem 0.35rem 0.35rem',
        borderRadius: '999px',
        backgroundColor: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: 'white', cursor: 'pointer', whiteSpace: 'nowrap',
        fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600, lineHeight: 1,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        ...style
      }}
    >
      <span
        className="back-btn-badge"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          width: `${badge}px`, height: `${badge}px`, borderRadius: '50%',
          backgroundColor: 'rgba(179,31,47,0.2)', color: '#ff6b7d'
        }}
      >
        <Chevron size={isMobile ? 13 : 14} />
      </span>
      {children}
    </button>
    </>
  )
}

export default BackButton
