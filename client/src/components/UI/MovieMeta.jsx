// The facts under a movie's title in the details modals, shared by
// MovieDetailModal and TMDBMovieModal:
//   <DirectorLink> — "Directed by <name>", the name in red so it's
//                    obviously clickable
//   <MovieFacts>   — runtime + release date (each with an icon) and the
//                    genres as chips; every item wraps as a whole unit

const styles = `
  .director-link { transition: color 0.15s; -webkit-tap-highlight-color: transparent; }
  .director-link:active { color: #ff6b7d !important; }
  @media (hover: hover) {
    .director-link:hover { color: #ff6b7d !important; }
  }
`

export function DirectorLink({ director, onClick, onHover, isMobile }) {
  if (!director?.name) return null
  const clickable = Boolean(director.id)

  return (
    <>
    <style>{styles}</style>
    <p style={{ margin: 0, fontSize: isMobile ? '0.82rem' : '0.88rem', color: '#8a8a8a', lineHeight: 1.5 }}>
      Directed by{' '}
      <span
        className={clickable ? 'director-link' : undefined}
        role={clickable ? 'link' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={() => clickable && onClick?.(director)}
        onKeyDown={(e) => { if (clickable && e.key === 'Enter') onClick?.(director) }}
        onMouseEnter={() => clickable && onHover?.(director)}
        style={{
          // Red = "you can click this" (only when there's actually a person
          // page to go to); a plain white name otherwise.
          color: clickable ? '#dc3c4f' : 'white', fontWeight: 700,
          cursor: clickable ? 'pointer' : 'default'
        }}
      >
        {director.name}
      </span>
    </p>
    </>
  )
}

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)

// 201 -> "3h 21m", 95 -> "1h 35m", 45 -> "45m"
const formatRuntime = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}

const Fact = ({ icon, children }) => (
  // nowrap: an item moves to the next line as a whole, never splitting
  // "17 December" from "2003".
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
    <span style={{ display: 'flex', color: '#dc3c4f' }}>{icon}</span>
    {children}
  </span>
)

export function MovieFacts({ genres, runtime, releaseDate, isMobile, style }) {
  const date = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: isMobile ? 'short' : 'long', year: 'numeric' })
    : null
  const hasGenres = genres?.length > 0
  if (!runtime && !date && !hasGenres) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.6rem' : '0.65rem', ...style }}>
      {(runtime || date) && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem 1rem',
          color: '#c4c4c4', fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 500
        }}>
          {runtime ? <Fact icon={<ClockIcon />}>{formatRuntime(runtime)}</Fact> : null}
          {date && <Fact icon={<CalendarIcon />}>{date}</Fact>}
        </div>
      )}

      {hasGenres && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {genres.map(genre => (
            <span key={genre} style={{
              padding: isMobile ? '0.22rem 0.6rem' : '0.25rem 0.7rem', borderRadius: '999px',
              backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#ddd', fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
