import Emoji from './Emoji'

// Average of every user's rating for this movie after logging it, shown in
// place of third-party critic scores (IMDb/RT/Metacritic).
function CommunityRating({ average, count }) {
  if (!count) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.55rem 1rem',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px', color: '#888', fontSize: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        <Emoji>⭐</Emoji> Not yet rated by the community
      </div>
    )
  }

  const pct = Math.max(0, Math.min(100, (average / 5) * 100))

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '1rem',
      padding: '0.6rem 1.4rem 0.6rem 0.6rem',
      background: 'linear-gradient(135deg, rgba(179,31,47,0.16) 0%, rgba(20,20,20,0.5) 60%)',
      border: '1px solid rgba(220,60,79,0.4)',
      borderRadius: '18px',
      boxShadow: '0 8px 26px rgba(179,31,47,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
      marginBottom: '1.25rem'
    }}>
      <div style={{
        position: 'relative', width: '58px', height: '58px', borderRadius: '50%',
        background: `conic-gradient(#dc3c4f ${pct}%, rgba(255,255,255,0.12) 0)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 0 14px rgba(220,60,79,0.35)'
      }}>
        <div style={{
          width: '47px', height: '47px', borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '1.15rem', fontWeight: '800', lineHeight: 1,
            background: 'linear-gradient(135deg, #ff8a8a 0%, #dc3c4f 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {average.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p style={{
          margin: '0 0 0.3rem 0', fontSize: '0.7rem', fontWeight: '800',
          letterSpacing: '0.08em', textTransform: 'uppercase', color: '#dc3c4f'
        }}>
          Community Rating
        </p>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ fontSize: '0.95rem', color: i <= Math.round(average) ? '#dc3c4f' : 'rgba(255,255,255,0.18)' }}>★</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommunityRating
