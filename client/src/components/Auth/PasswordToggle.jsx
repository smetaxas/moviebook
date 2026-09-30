// Show/hide button for password fields.
//
// A real <button> with a finger-sized hit area and inline SVG icons:
//  - no hover handlers: on touchscreens a tap fires "hover" first, and a
//    hover handler that changes state can make the browser swallow that
//    first tap, so the password only appeared on the second press;
//  - onMouseDown preventDefault keeps the input focused, so the phone's
//    keyboard doesn't close (and shift the page) when you tap the eye;
//  - the icons are inline, so swapping them never waits on a download.
function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={(e) => e.preventDefault()}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      style={{
        width: '36px', height: '36px', marginRight: '-0.45rem', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', borderRadius: '50%',
        color: visible ? '#dc3c4f' : '#9a9a9a', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {visible ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  )
}

export default PasswordToggle
