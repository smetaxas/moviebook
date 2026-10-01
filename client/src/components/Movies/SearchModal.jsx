import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import { prefetchMovie } from '../../api/movieCache'
import { prefetchPerson } from '../../api/personCache'
import { buildNavState } from '../../utils/navState'
import LogMovieModal from './LogMovieModal'
import TMDBMovieModal from './TMDBMovieModal'
import Avatar from '../UI/Avatar'
import FadeInImage from '../UI/FadeInImage'

const icon = (paths) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
)

const ICONS = {
  movies: icon(<>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <line x1="7.5" y1="4" x2="7.5" y2="20" /><line x1="16.5" y1="4" x2="16.5" y2="20" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </>),
  people: icon(<>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
  </>),
  users: icon(<>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20c.9-3.3 3.3-5 6.5-5s5.6 1.7 6.5 5" />
    <circle cx="17" cy="9.5" r="2.7" />
    <path d="M17.5 14.6c2.2.3 3.6 1.9 4.1 4.4" />
  </>),
  search: icon(<><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>),
  chevron: icon(<path d="M9 6l6 6-6 6" />),
}

const MODES = {
  movies: { label: 'Movies', endpoint: '/movies/search', placeholder: 'Search for a movie...', empty: 'Find a movie to log, rate or add to your watchlist.', noun: ['movie', 'movies'] },
  people: { label: 'Cast & Crew', short: 'People', endpoint: '/movies/search/people', placeholder: 'Search for an actor or director...', empty: 'Find an actor or director and explore their filmography.', noun: ['person', 'people'] },
  users: { label: 'Users', endpoint: '/user/search', placeholder: 'Search by username...', empty: "Find other CineLog members and see what they've been watching.", noun: ['user', 'users'] }
}

const styles = `
  @keyframes smFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes smPopIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
  @keyframes smSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  @keyframes smResults { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes smPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @keyframes smSpin { to { transform: rotate(360deg); } }
  .sm-tab, .sm-clear, .sm-close { -webkit-tap-highlight-color: transparent; }
  .sm-movie { cursor: pointer; min-width: 0; transition: transform 0.2s; }
  .sm-movie:active { transform: scale(0.97); }
  .sm-movie .sm-poster { transition: box-shadow 0.2s; }
  .sm-row { cursor: pointer; min-width: 0; transition: background-color 0.15s, border-color 0.15s; }
  .sm-row:active { background-color: rgba(255,255,255,0.07) !important; }
  .sm-row .sm-chevron { transition: transform 0.15s, color 0.15s; }
  .sm-input::-webkit-search-cancel-button, .sm-input::-webkit-search-decoration { -webkit-appearance: none; display: none; }
  .sm-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
  @media (hover: hover) {
    .sm-movie:hover { transform: translateY(-4px); }
    .sm-movie:hover .sm-poster { box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 0 2px rgba(220,60,79,0.6); }
    .sm-row:hover { background-color: rgba(255,255,255,0.06) !important; border-color: rgba(220,60,79,0.4) !important; }
    .sm-row:hover .sm-chevron { transform: translateX(3px); color: #dc3c4f; }
    .sm-tab:hover, .sm-clear:hover, .sm-close:hover { transform: none; filter: none; }
    .sm-close:hover, .sm-clear:hover { background-color: rgba(255,255,255,0.16) !important; }
  }
`

const pulse = 'smPulse 1.3s ease-in-out infinite'
const skeletonBg = 'rgba(255,255,255,0.06)'

function MovieCard({ movie, onSelect, isMobile }) {
  return (
    <div className="sm-movie" onClick={onSelect} onMouseEnter={() => prefetchMovie(movie.tmdb_id)}>
      <div className="sm-poster" style={{ aspectRatio: '2 / 3', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#1a1a1a', boxShadow: '0 6px 16px rgba(0,0,0,0.4)' }}>
        {movie.poster_url ? (
          <FadeInImage src={movie.poster_url} alt={movie.title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center', color: '#666', fontSize: '0.72rem' }}>
            No poster
          </div>
        )}
      </div>
      <p style={{
        color: 'white', fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 700, lineHeight: 1.25, margin: '0.5rem 0 0.15rem 0',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>{movie.title}</p>
      <p style={{ color: '#8a8a8a', fontSize: isMobile ? '0.68rem' : '0.72rem', margin: 0 }}>{movie.year || '—'}</p>
    </div>
  )
}

// People and users are rows: a picture, a name, and a line of detail.
function ResultRow({ picture, title, badge, detail, onSelect, onHover }) {
  return (
    <div className="sm-row" onClick={onSelect} onMouseEnter={onHover} style={{
      display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.8rem', borderRadius: '14px',
      backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'
    }}>
      <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>{picture}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: '0.92rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          {badge}
        </div>
        {detail && (
          <p style={{
            color: '#888', fontSize: '0.75rem', lineHeight: 1.4, margin: '0.2rem 0 0 0',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{detail}</p>
        )}
      </div>
      <span className="sm-chevron" style={{ color: '#555', display: 'flex', flexShrink: 0 }}>{ICONS.chevron}</span>
    </div>
  )
}

function PersonRow({ person, onSelect }) {
  const director = person.department === 'Director'
  return (
    <ResultRow
      onSelect={onSelect}
      onHover={() => prefetchPerson(person.id)}
      picture={<FadeInImage src={person.profile_url} alt={person.name} loading="lazy"
        style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', display: 'block', backgroundColor: '#1a1a1a' }} />}
      title={person.name}
      badge={
        <span style={{
          flexShrink: 0, padding: '0.1rem 0.45rem', borderRadius: '999px',
          backgroundColor: director ? 'rgba(179,31,47,0.18)' : 'rgba(255,255,255,0.08)',
          color: director ? '#ff6b7d' : '#bbb', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>{person.department}</span>
      }
      detail={person.known_for ? `Known for ${person.known_for}` : null}
    />
  )
}

function UserRow({ user, onSelect }) {
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null
  return (
    <ResultRow
      onSelect={onSelect}
      picture={<Avatar user={user} size={54} />}
      title={user.username}
      detail={<>
        <span style={{ color: '#dc3c4f', fontWeight: 700 }}>{user.watchedCount} {user.watchedCount === 1 ? 'movie' : 'movies'} logged</span>
        {joined && <> · Joined {joined}</>}
      </>}
    />
  )
}

// A circle with the tab's icon, over a line of text — for "type something"
// and "nothing found".
function Message({ iconNode, title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', animation: 'smFadeIn 0.25s ease' }}>
      <div style={{
        width: '64px', height: '64px', margin: '0 auto 1rem', borderRadius: '50%', color: '#dc3c4f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(179,31,47,0.12)', border: '1px solid rgba(220,60,79,0.3)'
      }}>
        <span style={{ display: 'flex', transform: 'scale(1.5)' }}>{iconNode}</span>
      </div>
      {title && <p style={{ color: 'white', fontWeight: 700, margin: '0 0 0.35rem 0', fontSize: '0.98rem', overflowWrap: 'anywhere' }}>{title}</p>}
      <p style={{ color: '#888', margin: '0 auto', fontSize: '0.88rem', maxWidth: '340px', lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}

function SearchModal({ onClose, onMovieLogged, onWatchlistChange, onFavoriteChange, initialQuery = '', initialMode = 'movies' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(initialMode)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  // The query the shown results belong to (so "no results" isn't claimed
  // for letters that haven't been searched yet).
  const [resultsFor, setResultsFor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const isMobile = useIsMobile()
  const trimmed = query.trim()

  useEffect(() => {
    if (!trimmed) return

    let stale = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        // encoded: "&", "#" or "?" in what you typed would otherwise break the URL
        const res = await api.get(`${MODES[mode].endpoint}?q=${encodeURIComponent(trimmed)}`)
        if (!stale) {
          setResults(res.data)
          setResultsFor(`${mode}:${trimmed}`)
          scrollRef.current?.scrollTo({ top: 0 })
        }
      } catch {
        if (!stale) setError('Search failed. Check your connection and try again.')
      } finally {
        if (!stale) setLoading(false)
      }
    }, mode === 'users' ? 300 : 450)

    return () => { stale = true; clearTimeout(timer) }
  }, [trimmed, mode])

  // Esc closes (unless a movie opened from here is on top — it has its own).
  useEffect(() => {
    if (selectedMovie || movieToLog) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedMovie, movieToLog, onClose])

  // The page underneath mustn't scroll while the search is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Switching tabs: drop the old tab's results straight away — otherwise
  // they'd be drawn for a moment with the new tab's cards.
  const switchMode = (key) => {
    if (key === mode) return
    setResults([])
    setResultsFor(null)
    setError('')
    setMode(key)
    if (!isMobile) inputRef.current?.focus()
  }

  const clearQuery = () => {
    setQuery('')
    setResults([])
    setResultsFor(null)
    setError('')
    inputRef.current?.focus()
  }

  // Same "go back and reopen" contract goToPerson uses everywhere else in
  // the app (TMDBMovieModal, MovieDetailModal) — without backTo, the
  // person page's own "← Back" button falls through to a plain
  // navigate(-1), which isn't reliable here since the search modal itself
  // never changes the URL (it's just an overlay on the current page).
  // reopenSearch additionally carries the mode/query so "← Back" reopens
  // this same search — tab and typed letters intact — rather than just
  // landing back on a bare profile page.
  // Same contract for another user's profile: their page's "Back" returns
  // here with this search reopened.
  const goToUser = (user) => {
    navigate(`/user/${user._id}`, {
      state: buildNavState(location, { reopenSearch: { mode, query } })
    })
    onClose()
  }

  const goToPerson = (person) => {
    navigate(`/person/${person.id}`, {
      state: buildNavState(location, {
        initialPerson: { id: person.id, name: person.name, profile_url: person.profile_url },
        reopenSearch: { mode, query }
      })
    })
    onClose()
  }

  const m = MODES[mode]
  const upToDate = resultsFor === `${mode}:${trimmed}`
  const showResults = trimmed && results.length > 0 && resultsFor?.startsWith(mode + ':')
  const showSkeleton = trimmed && !showResults && !error && (loading || !upToDate)
  const noResults = trimmed && upToDate && !loading && !error && results.length === 0

  const movieGrid = {
    display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '96px' : '135px'}, 1fr))`,
    gap: isMobile ? '1rem 0.65rem' : '1.4rem 1rem'
  }
  const rowGrid = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.6rem'
  }
  const pad = isMobile ? '1rem' : '1.75rem'

  return (
    <>
      <style>{styles}</style>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: isMobile ? 0 : '1.5rem', animation: 'smFadeIn 0.2s ease'
        }}
      >
        <div role="dialog" aria-modal="true" aria-label="Search" style={{
          position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          width: '100%', maxWidth: isMobile ? 'none' : '880px',
          height: isMobile ? '100dvh' : 'min(820px, 88dvh)',
          background: 'linear-gradient(160deg, #1b1b1b 0%, #121212 100%)',
          borderRadius: isMobile ? 0 : '22px',
          border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          animation: isMobile ? 'smSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)' : 'smPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-90px', right: '-90px', width: '240px', height: '240px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(179,31,47,0.22) 0%, transparent 70%)', pointerEvents: 'none'
          }} />

          {/* ---------- Fixed top: title, tabs, search box ---------- */}
          <div style={{
            position: 'relative', flexShrink: 0,
            padding: `calc(${isMobile ? '0.9rem' : '1.5rem'} + env(safe-area-inset-top)) ${pad} ${isMobile ? '0.9rem' : '1.1rem'}`,
            borderBottom: '1px solid rgba(255,255,255,0.07)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '0.85rem' : '1.1rem' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Search</h2>
              <button type="button" className="sm-close" onClick={onClose} aria-label="Close search" style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s'
              }}>✕</button>
            </div>

            {/* The search box */}
            <div style={{ position: 'relative', marginBottom: isMobile ? '0.75rem' : '0.9rem' }}>
              <span style={{
                position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', display: 'flex',
                color: inputFocused ? '#dc3c4f' : '#777', transition: 'color 0.2s', pointerEvents: 'none'
              }}>
                {loading
                  ? <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(220,60,79,0.25)', borderTopColor: '#dc3c4f', animation: 'smSpin 0.7s linear infinite' }} />
                  : ICONS.search}
              </span>
              <input
                ref={inputRef}
                className="sm-input"
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder={m.placeholder}
                aria-label={m.placeholder}
                autoFocus={!isMobile || !initialQuery}
                style={{
                  width: '100%', height: '50px', padding: '0 2.9rem 0 2.75rem', borderRadius: '14px',
                  border: '1px solid ' + (inputFocused ? 'rgba(220,60,79,0.75)' : 'rgba(255,255,255,0.1)'),
                  backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box',
                  fontSize: isMobile ? '16px' : '1rem', outline: 'none',
                  boxShadow: inputFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s', WebkitAppearance: 'none'
                }}
              />
              {query && (
                <button type="button" className="sm-clear" onClick={clearQuery} aria-label="Clear search" style={{
                  position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                  width: '30px', height: '30px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.08)', color: '#ccc', fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s'
                }}>✕</button>
              )}
            </div>

            {/* Movies / Cast & Crew / Users */}
            <div role="tablist" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', padding: '0.25rem',
              width: isMobile ? '100%' : '460px', maxWidth: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {Object.entries(MODES).map(([key, mo]) => {
                const active = mode === key
                return (
                  <button key={key} type="button" role="tab" aria-selected={active} className="sm-tab" onClick={() => switchMode(key)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: isMobile ? '0.55rem 0.25rem' : '0.55rem 0.75rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : 'transparent',
                    color: active ? 'white' : '#999', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 700, whiteSpace: 'nowrap',
                    boxShadow: active ? '0 4px 12px rgba(179,31,47,0.4)' : 'none',
                    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s'
                  }}>
                    {ICONS[key]}
                    {isMobile && mo.short ? mo.short : mo.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---------- Results (the only part that scrolls) ---------- */}
          <div ref={scrollRef} className="sm-scroll" style={{
            flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
            padding: `${isMobile ? '1rem' : '1.25rem'} ${pad} calc(${isMobile ? '1.5rem' : '1.75rem'} + env(safe-area-inset-bottom))`
          }}>
            {!trimmed && <Message iconNode={ICONS[mode]} text={m.empty} />}

            {error && (
              <p style={{
                color: '#ff6b7d', backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(179,31,47,0.3)',
                borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.85rem', margin: '0 0 1rem 0'
              }}>{error}</p>
            )}

            {noResults && (
              <Message iconNode={ICONS.search} title={`No ${m.noun[1]} found for “${trimmed}”`} text="Check the spelling, or try fewer or different words." />
            )}

            {showSkeleton && (
              mode === 'movies' ? (
                <div style={movieGrid}>
                  {Array.from({ length: isMobile ? 9 : 10 }, (_, i) => (
                    <div key={i}>
                      <div style={{ aspectRatio: '2 / 3', borderRadius: '10px', backgroundColor: skeletonBg, animation: pulse }} />
                      <div style={{ height: '0.7rem', width: '80%', borderRadius: '4px', marginTop: '0.55rem', backgroundColor: skeletonBg, animation: pulse }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={rowGrid}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.8rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0, backgroundColor: skeletonBg, animation: pulse }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '0.8rem', width: '55%', borderRadius: '4px', backgroundColor: skeletonBg, animation: pulse }} />
                        <div style={{ height: '0.65rem', width: '80%', borderRadius: '4px', marginTop: '0.5rem', backgroundColor: skeletonBg, animation: pulse }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {showResults && (
              <>
                <p style={{ color: '#777', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.85rem 0' }}>
                  {results.length} {results.length === 1 ? m.noun[0] : m.noun[1]}
                </p>
                <div key={resultsFor} style={{
                  ...(mode === 'movies' ? movieGrid : rowGrid),
                  animation: 'smResults 0.25s ease', opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s'
                }}>
                  {mode === 'movies'
                    ? results.map(movie => (
                      <MovieCard key={movie.tmdb_id} movie={movie} isMobile={isMobile} onSelect={() => setSelectedMovie(movie)} />
                    ))
                    : mode === 'users'
                      ? results.map(user => (
                        <UserRow key={user._id} user={user} onSelect={() => goToUser(user)} />
                      ))
                      : results.map(person => (
                        <PersonRow key={person.id} person={person} onSelect={() => goToPerson(person)} />
                      ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedMovie && (
        <TMDBMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onLogMovie={(movie) => {
            setSelectedMovie(null)
            setMovieToLog(movie)
          }}
          onWatchlistChange={onWatchlistChange}
          onFavoriteChange={onFavoriteChange}
        />
      )}

      {movieToLog && (
        <LogMovieModal
          movie={movieToLog}
          onClose={() => setMovieToLog(null)}
          onLogged={() => {
            setMovieToLog(null)
            onMovieLogged()
            onClose()
          }}
        />
      )}
    </>
  )
}

export default SearchModal
