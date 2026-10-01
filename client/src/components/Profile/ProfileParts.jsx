// The profile design shared by your own page (Profile) and other users'
// pages (UserProfile): the header card and the Watched / Watchlist /
// Favorites lists with their poster grid.
import { prefetchMovie } from '../../api/movieCache'
import Emoji from '../UI/Emoji'

export const profileStyles = `
  @keyframes upFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes upPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  .up-card { cursor: pointer; transition: transform 0.2s; -webkit-tap-highlight-color: transparent; min-width: 0; }
  .up-card:active { transform: scale(0.97); }
  .up-card .up-poster { transition: box-shadow 0.2s; }
  .up-stat { transition: background-color 0.15s, border-color 0.15s; -webkit-tap-highlight-color: transparent; }
  @media (hover: hover) {
    .up-card:hover { transform: translateY(-4px); }
    .up-card:hover .up-poster { box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 0 2px rgba(220,60,79,0.6); }
    .up-stat:hover { transform: none; filter: none; background-color: rgba(255,255,255,0.07) !important; }
    .up-sort:hover { transform: none; filter: none; }
  }
`

const pulse = 'upPulse 1.3s ease-in-out infinite'

const Stars = ({ rating }) => (
  <span style={{ display: 'inline-flex', gap: '1px', lineHeight: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: '0.78rem', color: i <= rating ? '#ff4d61' : 'rgba(255,255,255,0.28)' }}>★</span>
    ))}
  </span>
)

const shortDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

// One poster in a list. "watched" cards show the user's own stars on the
// poster and when they watched it; the others just show the year.
function MovieCard({ movie, kind, onClick, isMobile }) {
  return (
    <div className="up-card" onClick={() => onClick(movie)} onMouseEnter={() => prefetchMovie(movie.movie_id || movie.tmdb_id)}>
      <div style={{ position: 'relative' }}>
        {movie.movie_poster ? (
          <img className="up-poster" src={movie.movie_poster} alt={movie.movie_title} loading="lazy"
            style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '10px', display: 'block', backgroundColor: '#1a1a1a', boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }} />
        ) : (
          <div className="up-poster" style={{ width: '100%', aspectRatio: '2 / 3', backgroundColor: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#777', fontSize: '0.75rem' }}>No Poster</span>
          </div>
        )}
        {kind === 'watched' && movie.rating > 0 && (
          <span style={{
            position: 'absolute', left: '6px', bottom: '6px', padding: '0.2rem 0.4rem', borderRadius: '7px',
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
          }}>
            <Stars rating={movie.rating} />
          </span>
        )}
      </div>
      <p style={{
        fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 700, lineHeight: 1.25, margin: '0.5rem 0 0.15rem 0',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>{movie.movie_title}</p>
      <p style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: '#8a8a8a', margin: 0 }}>
        {kind === 'watched'
          ? <>{movie.rating ? null : <span style={{ color: '#666', fontStyle: 'italic' }}>Not rated · </span>}{shortDate(movie.watchedAt) || movie.movie_year}</>
          : movie.movie_year}
      </p>
    </div>
  )
}

// A stat in the header; each one is also a shortcut to its list.
function Stat({ value, label, onClick, active, compact }) {
  return (
    <button
      type="button"
      className="up-stat"
      onClick={onClick}
      aria-pressed={active}
      style={{
        minWidth: 0, textAlign: 'center', cursor: 'pointer',
        padding: compact ? '0.6rem 0.25rem' : '0.75rem 1.2rem', borderRadius: '14px',
        backgroundColor: active ? 'rgba(179,31,47,0.16)' : 'rgba(255,255,255,0.04)',
        border: '1px solid ' + (active ? 'rgba(220,60,79,0.55)' : 'rgba(255,255,255,0.08)'),
        color: 'white'
      }}
    >
      <span style={{ display: 'block', fontSize: compact ? '1.2rem' : '1.55rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</span>
      <span style={{ display: 'block', color: '#999', marginTop: '0.3rem', fontSize: compact ? '0.6rem' : '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

const SORTS = [
  { value: 'recent', label: 'Recent' },
  { value: 'rating', label: 'Top rated' },
  { value: 'title', label: 'A–Z' },
]

// Header card. layout:
//  'wide'   — avatar · name · divider · stats, all in one row
//  'medium' — avatar + name on top, stats in a full-width row below
//  'narrow' — everything stacked and centred (phones)
// avatar(size) renders the picture, so your own page can add its upload button.
// showJoined: the "Member since" date (your own page leaves it to My Account).
export function ProfileHeader({ user, layout, avatar, watchedMovies, watchlistCount, favoritesCount, activeTab, onStatClick, cardRef, showJoined = true }) {
  const narrow = layout === 'narrow'
  const wide = layout === 'wide'
  const avatarSize = wide ? 96 : layout === 'medium' ? 80 : 84

  const rated = watchedMovies.filter(m => m.rating > 0)
  const avgRating = rated.length ? (rated.reduce((n, m) => n + m.rating, 0) / rated.length).toFixed(1) : null

  // Their taste: most-watched genres.
  const counts = new Map()
  for (const m of watchedMovies) for (const g of m.movie_genres || []) counts.set(g, (counts.get(g) || 0) + 1)
  const topGenres = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g)

  return (
    <div ref={cardRef} style={{
      position: 'relative', overflow: 'hidden', borderRadius: '20px',
      background: 'linear-gradient(135deg, rgba(179,31,47,0.1) 0%, rgba(255,255,255,0.03) 55%)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      padding: narrow ? '1.5rem 1rem 1rem' : wide ? '1.75rem 2.25rem' : '1.4rem 1.4rem 1.2rem',
      marginBottom: narrow ? '1.25rem' : '1.75rem'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-70px', left: '-70px', width: '220px', height: '220px',
        background: 'radial-gradient(circle, rgba(179,31,47,0.28) 0%, transparent 70%)', pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: layout === 'medium' ? 'stretch' : 'center', gap: wide ? '1.75rem' : '1.1rem'
      }}>
        {/* Avatar + name: side by side, except stacked on a phone */}
        <div style={{
          display: 'flex', alignItems: 'center', minWidth: 0,
          flexDirection: narrow ? 'column' : 'row', textAlign: narrow ? 'center' : 'left',
          gap: narrow ? '0.9rem' : wide ? '1.75rem' : '1.1rem',
          flex: wide ? 1 : 'none', width: narrow ? '100%' : undefined
        }}>
          <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: '0 6px 18px rgba(179,31,47,0.4)' }}>
            {user ? avatar(avatarSize)
              : <div style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)', animation: pulse }} />}
          </div>

          <div style={{ flex: narrow ? 'none' : 1, minWidth: 0, maxWidth: '100%' }}>
            {user ? (
              <>
                <h1 style={{ margin: 0, fontSize: narrow ? '1.45rem' : '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}>{user.username || user.email}</h1>
                {/* Joined + their average rating: facts about the person, so they
                    sit with the name rather than among the list shortcuts. */}
                <p style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem 0.6rem',
                  justifyContent: narrow ? 'center' : 'flex-start',
                  color: '#999', margin: '0.3rem 0 0 0', fontSize: '0.85rem'
                }}>
                  {showJoined && <span>Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>}
                  {avgRating && (
                    <>
                      {/* phones: the rating wraps onto its own line — no dangling dot */}
                      {showJoined && !narrow && <span style={{ color: '#555' }}>·</span>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#ff4d61', fontWeight: 800 }}>★ {avgRating}</span>
                        <span>average · {rated.length} rated</span>
                      </span>
                    </>
                  )}
                </p>
                {topGenres.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', marginTop: '0.65rem', justifyContent: narrow ? 'center' : 'flex-start' }}>
                    <span style={{ color: '#777', fontSize: '0.72rem', fontWeight: 600, marginRight: '0.1rem' }}>Into</span>
                    {topGenres.map(g => (
                      <span key={g} style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: 'rgba(179,31,47,0.14)', border: '1px solid rgba(220,60,79,0.35)', color: '#ffb3bb', fontSize: '0.72rem', fontWeight: 700 }}>{g}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: narrow ? 'center' : 'flex-start' }}>
                <div style={{ width: '180px', height: '1.5rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.07)', animation: pulse }} />
                <div style={{ width: '130px', height: '0.85rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.07)', animation: pulse }} />
              </div>
            )}
          </div>
        </div>

        {wide && (
          <div style={{ width: '1px', height: '56px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)', flexShrink: 0 }} />
        )}

        {/* The three lists — each opens its tab below */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: narrow ? '0.45rem' : '0.6rem',
          width: wide ? 'auto' : '100%', flexShrink: 0
        }}>
          <Stat value={watchedMovies.length} label="Watched" onClick={() => onStatClick('watched')} active={activeTab === 'watched'} compact={narrow} />
          <Stat value={watchlistCount} label="To watch" onClick={() => onStatClick('watchlist')} active={activeTab === 'watchlist'} compact={narrow} />
          <Stat value={favoritesCount} label="Favorites" onClick={() => onStatClick('favorites')} active={activeTab === 'favorites'} compact={narrow} />
        </div>
      </div>
    </div>
  )
}

// The open list (picked with the header's stats): its title, the sort for
// Watched, and the poster grid. Watchlist/favorites clicks get the movie in
// the shape TMDBMovieModal takes.
export function ProfileLists({ tab, titles, sort, onSortChange, watchedMovies, watchlist, favorites, loading, isMobile, emptyText, onOpenWatched, onOpenListMovie }) {
  const sortedWatched = [...watchedMovies].sort((a, b) => {
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0) || new Date(b.watchedAt) - new Date(a.watchedAt)
    if (sort === 'title') return (a.movie_title || '').localeCompare(b.movie_title || '')
    return new Date(b.watchedAt) - new Date(a.watchedAt)
  })

  const openListMovie = (movie) => onOpenListMovie({
    tmdb_id: movie.movie_id, title: movie.movie_title, poster_url: movie.movie_poster, year: movie.movie_year
  })

  const current = tab === 'watched'
    ? { list: sortedWatched, icon: '🎬', open: onOpenWatched }
    : tab === 'watchlist'
      ? { list: watchlist, icon: '🎯', open: openListMovie }
      : { list: favorites, icon: '❤️', open: openListMovie }
  const gridGap = isMobile ? '1rem 0.6rem' : '1.4rem 1rem'

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.25rem', paddingBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* No tab buttons — the header's stats switch lists; this names the open one. */}
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '0.5rem', fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800 }}>
          {titles[tab]}
          <span style={{ color: '#777', fontSize: '0.8rem', fontWeight: 700 }}>{current.list.length}</span>
        </h3>

        {tab === 'watched' && watchedMovies.length > 1 && (
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {SORTS.map(o => {
              const on = sort === o.value
              return (
                <button key={o.value} className="up-sort" onClick={() => onSortChange(o.value)} aria-pressed={on}
                  style={{
                    padding: '0.35rem 0.7rem', borderRadius: '999px', cursor: 'pointer', whiteSpace: 'nowrap',
                    backgroundColor: on ? 'rgba(179,31,47,0.18)' : 'transparent',
                    border: '1px solid ' + (on ? 'rgba(220,60,79,0.55)' : 'rgba(255,255,255,0.12)'),
                    color: on ? '#ff6b7d' : '#999', fontSize: '0.75rem', fontWeight: 700
                  }}>
                  {o.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--poster-min), 1fr))', gap: gridGap, marginBottom: '2rem' }}>
          {Array.from({ length: isMobile ? 6 : 12 }, (_, i) => (
            <div key={i} style={{ aspectRatio: '2 / 3', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)', animation: pulse }} />
          ))}
        </div>
      ) : current.list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem' : '3.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }}>
          <p style={{ fontSize: '2.2rem', margin: '0 0 0.6rem 0' }}><Emoji>{current.icon}</Emoji></p>
          <p style={{ color: '#999', margin: 0 }}>{emptyText[tab]}</p>
        </div>
      ) : (
        <div key={tab + sort} style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--poster-min), 1fr))',
          gap: gridGap, marginBottom: '2rem', animation: 'upFadeIn 0.3s ease'
        }}>
          {current.list.map((movie, i) => (
            <MovieCard key={movie._id || i} movie={movie} kind={tab} onClick={current.open} isMobile={isMobile} />
          ))}
        </div>
      )}
    </>
  )
}
