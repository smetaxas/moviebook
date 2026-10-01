// The home page's "Trending this week" and "Coming soon" sections.
import { prefetchMovie } from '../../api/movieCache'
import ScrollRow from '../UI/ScrollRow'
import FadeInImage from '../UI/FadeInImage'

const styles = `
  @keyframes dsPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @keyframes dsFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .ds-row { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .ds-row::-webkit-scrollbar { display: none; }
  .ds-item { cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .ds-item .ds-poster { transition: transform 0.2s, box-shadow 0.2s; }
  .ds-item .ds-rank { transition: -webkit-text-stroke-color 0.2s, color 0.2s; }
  .ds-item:active .ds-poster { transform: scale(0.97); }
  .ds-hero { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .ds-hero .ds-hero-img { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  @media (hover: hover) {
    .ds-item:hover .ds-poster { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 0 2px rgba(220,60,79,0.6); }
    .ds-item:hover .ds-rank { -webkit-text-stroke-color: #dc3c4f; }
    .ds-hero:hover .ds-hero-img { transform: scale(1.03); }
    .ds-hero:hover .ds-hero-btn { background: #dc3c4f !important; filter: none; transform: none; }
  }
`

const pulse = 'dsPulse 1.3s ease-in-out infinite'
const skeletonBg = 'rgba(255,255,255,0.06)'

// "2026-10-24" as a local date (new Date() would read it as UTC midnight,
// which is the day before in the Americas).
const parseDay = (s) => {
  const [y, m, d] = (s || '').split('-').map(Number)
  return y ? new Date(y, m - 1, d) : null
}

const countdown = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((date - today) / 86400000)
  if (days <= 0) return 'Out today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 14) return 'Next week'
  if (days < 60) return `In ${Math.round(days / 7)} weeks`
  return `In ${Math.round(days / 30)} months`
}

function SectionHeader({ eyebrow, title, subtitle, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? '0.85rem' : '1.1rem' }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: '0 0 0.3rem 0', color: '#dc3c4f', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        <span style={{ width: '3px', height: '0.8rem', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
        {eyebrow}
      </p>
      <h3 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h3>
      {subtitle && <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.85rem' }}>{subtitle}</p>}
    </div>
  )
}

// Rows run to the edges of the content column (ScrollRow's bleed) and fade
// out at the sides (its fade overlays). Free, native momentum scrolling:
// no snapping and no mask on the scrolling element — both made swiping
// on a phone feel stiff.
const rowStyle = (isMobile) => ({
  display: 'flex', gap: isMobile ? '0.75rem' : '1rem', overflowX: 'auto', overscrollBehaviorX: 'contain',
  padding: '0.4rem var(--page-pad) 0.6rem'
})
const ROW_BLEED = 'var(--page-pad)'
const PAGE_BG = '#0a0a0a'

function Poster({ movie, width, children }) {
  return (
    <div className="ds-poster" style={{
      position: 'relative', width, aspectRatio: '2 / 3', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
      backgroundColor: '#1a1a1a', boxShadow: '0 6px 18px rgba(0,0,0,0.45)'
    }}>
      {movie.poster_url ? (
        <FadeInImage src={movie.poster_url} alt={movie.title} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center', color: '#777', fontSize: '0.75rem' }}>{movie.title}</div>
      )}
      {children}
    </div>
  )
}

const Title = ({ children, width, isMobile }) => (
  <p style={{
    width, margin: '0.55rem 0 0.15rem 0', fontSize: isMobile ? '0.78rem' : '0.84rem', fontWeight: 700, lineHeight: 1.25,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
  }}>{children}</p>
)

function RowSkeleton({ isMobile, width }) {
  return (
    <div className="ds-row" style={{ ...rowStyle(isMobile), overflow: 'hidden', margin: `0 calc(-1 * ${ROW_BLEED})` }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ flexShrink: 0, width }}>
          <div style={{ aspectRatio: '2 / 3', borderRadius: '10px', backgroundColor: skeletonBg, animation: pulse }} />
          <div style={{ height: '0.7rem', width: '75%', borderRadius: '4px', marginTop: '0.6rem', backgroundColor: skeletonBg, animation: pulse }} />
        </div>
      ))}
    </div>
  )
}

// The week's #1, big: its backdrop with the title and plot over it.
function Spotlight({ movie, onOpen, isMobile }) {
  const image = movie.backdrop_url || movie.poster_url
  return (
    <div className="ds-hero" onClick={() => onOpen(movie)} onMouseEnter={() => prefetchMovie(movie.tmdb_id)} style={{
      position: 'relative', overflow: 'hidden', borderRadius: '18px', marginBottom: isMobile ? '1.1rem' : '1.4rem',
      aspectRatio: isMobile ? '16 / 10' : undefined, height: isMobile ? undefined : 'clamp(260px, 30vw, 360px)',
      backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
      animation: 'dsFadeIn 0.35s ease'
    }}>
      {image && (
        <FadeInImage className="ds-hero-img" src={image} alt="" duration={600} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: movie.backdrop_url ? 'center 25%' : 'center', display: 'block',
          filter: movie.backdrop_url ? undefined : 'blur(18px) brightness(0.6)'
        }} />
      )}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: isMobile
          ? 'linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.7) 40%, rgba(10,10,10,0.05) 75%)'
          : 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.75) 38%, rgba(10,10,10,0.1) 70%), linear-gradient(to top, rgba(10,10,10,0.6), transparent 40%)'
      }} />

      <div style={{
        position: 'absolute', left: 0, bottom: 0, top: isMobile ? undefined : 0,
        width: isMobile ? '100%' : 'min(52%, 520px)', boxSizing: 'border-box',
        padding: isMobile ? '1rem' : '2rem 2.25rem',
        display: 'flex', flexDirection: 'column', justifyContent: isMobile ? 'flex-end' : 'center'
      }}>
        <span style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.6rem', borderRadius: '999px', marginBottom: isMobile ? '0.5rem' : '0.75rem',
          background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)', boxShadow: '0 4px 14px rgba(179,31,47,0.45)',
          fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase'
        }}>#1 this week</span>
        <h4 style={{
          margin: 0, fontSize: isMobile ? '1.35rem' : 'clamp(1.6rem, 2.6vw, 2.2rem)', fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.6)'
        }}>{movie.title}</h4>
        {movie.year && <p style={{ margin: '0.35rem 0 0 0', color: '#bbb', fontSize: '0.85rem', fontWeight: 600 }}>{movie.year}</p>}
        {movie.description && (
          <p style={{
            margin: isMobile ? '0.45rem 0 0 0' : '0.75rem 0 0 0', color: '#ccc', fontSize: isMobile ? '0.8rem' : '0.9rem', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{movie.description}</p>
        )}
        {!isMobile && (
          <span className="ds-hero-btn" style={{
            alignSelf: 'flex-start', marginTop: '1.1rem', padding: '0.6rem 1.1rem', borderRadius: '10px',
            backgroundColor: '#b31f2f', fontSize: '0.85rem', fontWeight: 700, transition: 'background-color 0.15s',
            boxShadow: '0 6px 18px rgba(179,31,47,0.35)'
          }}>View details</span>
        )}
      </div>
    </div>
  )
}

export function TrendingSection({ movies, onOpen, isMobile }) {
  const posterW = isMobile ? 112 : 150
  const [top, ...rest] = movies

  return (
    <section style={{ marginBottom: isMobile ? '2rem' : '2.75rem' }}>
      <style>{styles}</style>
      <SectionHeader eyebrow="Trending" title="Trending this week" subtitle="What everyone's watching right now" isMobile={isMobile} />

      {movies.length === 0 ? (
        <>
          <div style={{ borderRadius: '18px', marginBottom: '1.2rem', aspectRatio: isMobile ? '16 / 10' : undefined, height: isMobile ? undefined : 'clamp(260px, 30vw, 360px)', backgroundColor: skeletonBg, animation: pulse }} />
          <RowSkeleton isMobile={isMobile} width={posterW} />
        </>
      ) : (
        <>
          <Spotlight movie={top} onOpen={onOpen} isMobile={isMobile} />
          {/* The rest, ranked: a big outlined number tucked behind each poster */}
          <ScrollRow className="ds-row" arrows scrollbar arrowTop="42%" bleed={ROW_BLEED} fade={PAGE_BG} style={rowStyle(isMobile)}>
            {rest.map((movie, i) => (
              <div key={movie.tmdb_id} className="ds-item" onClick={() => onOpen(movie)} onMouseEnter={() => prefetchMovie(movie.tmdb_id)}>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <span className="ds-rank" aria-label={`Number ${i + 2}`} style={{
                    fontSize: isMobile ? '4.6rem' : '6.2rem', fontWeight: 900, lineHeight: 0.78, letterSpacing: '-0.06em',
                    color: '#0a0a0a', WebkitTextStroke: `${isMobile ? 2 : 3}px rgba(255,255,255,0.32)`,
                    marginRight: isMobile ? '-0.7rem' : '-1rem', userSelect: 'none', position: 'relative', zIndex: 0
                  }}>{i + 2}</span>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <Poster movie={movie} width={posterW} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: posterW }}>
                    <Title width={posterW} isMobile={isMobile}>{movie.title}</Title>
                    <p style={{ margin: 0, color: '#8a8a8a', fontSize: '0.72rem' }}>{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollRow>
        </>
      )}
    </section>
  )
}

export function UpcomingSection({ movies, onOpen, isMobile }) {
  const posterW = isMobile ? 124 : 160

  return (
    <section style={{ marginBottom: '2rem' }}>
      <style>{styles}</style>
      <SectionHeader eyebrow="Coming soon" title="Coming to cinemas" subtitle="Mark your calendar" isMobile={isMobile} />

      {movies.length === 0 ? (
        <RowSkeleton isMobile={isMobile} width={posterW} />
      ) : (
        <ScrollRow className="ds-row" arrows scrollbar arrowTop="38%" bleed={ROW_BLEED} fade={PAGE_BG} style={rowStyle(isMobile)}>
          {movies.map(movie => {
            const date = parseDay(movie.release_date)
            return (
              <div key={movie.tmdb_id} className="ds-item" style={{ width: posterW }} onClick={() => onOpen(movie)} onMouseEnter={() => prefetchMovie(movie.tmdb_id)}>
                <Poster movie={movie} width={posterW}>
                  {/* A little calendar page with the release day */}
                  {date && (
                    <div style={{
                      position: 'absolute', top: '7px', left: '7px', width: isMobile ? '38px' : '42px', borderRadius: '8px', overflow: 'hidden',
                      textAlign: 'center', backgroundColor: 'rgba(12,12,12,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ backgroundColor: '#b31f2f', fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.08em', padding: '0.12rem 0' }}>
                        {date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, padding: '0.1rem 0 0.15rem' }}>{date.getDate()}</div>
                    </div>
                  )}
                </Poster>
                <Title width={posterW} isMobile={isMobile}>{movie.title}</Title>
                {date && (
                  <p style={{ margin: 0, fontSize: '0.72rem' }}>
                    <span style={{ color: '#ff6b7d', fontWeight: 700 }}>{countdown(date)}</span>
                    <span style={{ color: '#777' }}> · {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </p>
                )}
              </div>
            )
          })}
        </ScrollRow>
      )}
    </section>
  )
}
