function Logo({ size = 32, showText = true, textSize }) {
  const fontSize = textSize || `${size * 0.56}px`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${size * 0.34}px` }}>
      <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cinelog-mark-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1a1a1a" />
            <stop offset="1" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="cinelog-mark-accent" x1="13" y1="13" x2="49" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ff3b3b" />
            <stop offset="1" stopColor="#e50914" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#cinelog-mark-bg)" />
        <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="#e50914" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M32 13a19 19 0 1 0 15.5 30" fill="none" stroke="url(#cinelog-mark-accent)" strokeWidth="7" strokeLinecap="round" />
        <path d="M35 24 L49 32 L35 40 Z" fill="url(#cinelog-mark-accent)" />
      </svg>
      {showText && (
        <span style={{ fontSize, fontWeight: '800', letterSpacing: '-0.5px', color: 'white', lineHeight: 1, whiteSpace: 'nowrap' }}>
          Cine<span style={{ color: '#e50914' }}>Log</span>
        </span>
      )}
    </div>
  )
}

export default Logo
