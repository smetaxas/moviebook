// Placeholder for the part of the movie modal that genuinely needs a fetch
// (description, cast, ratings) — the poster/title/year above it render
// immediately from data the caller already had, so this is the only part
// that's ever actually blank.
function MovieDetailsSkeleton() {
  const bar = (width, height = '0.9rem') => ({
    width, height, borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.07)',
    animation: 'movieSkeletonPulse 1.3s ease-in-out infinite'
  })

  return (
    <div>
      <style>{`
        @keyframes movieSkeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ ...bar('140px', '2.6rem'), borderRadius: '14px', marginBottom: '1.25rem' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={bar('100%')} />
        <div style={bar('96%')} />
        <div style={bar('70%')} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ flexShrink: 0, width: '64px', textAlign: 'center' }}>
            <div style={{ ...bar('64px', '64px'), borderRadius: '50%', marginBottom: '0.4rem' }} />
            <div style={{ ...bar('90%', '0.6rem'), margin: '0 auto' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={bar('120px', '2.2rem')} />
        <div style={bar('100px', '2.2rem')} />
        <div style={bar('100px', '2.2rem')} />
      </div>
    </div>
  )
}

export default MovieDetailsSkeleton
