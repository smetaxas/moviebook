import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import { prefetchMovie } from '../../api/movieCache'
import { prefetchPerson } from '../../api/personCache'
import { buildNavState } from '../../utils/navState'
import LogMovieModal from './LogMovieModal'
import TMDBMovieModal from './TMDBMovieModal'
import Emoji from '../UI/Emoji'

const MODES = {
  movies: { label: 'Movies', icon: '🎬', endpoint: '/movies/search', placeholder: 'Search for a movie...', empty: 'Start typing to find a movie to log or add to your watchlist.', noResults: 'No movies found' },
  people: { label: 'People', icon: '🎭', endpoint: '/movies/search/people', placeholder: 'Search for an actor or director...', empty: 'Start typing to find an actor, director, or other cast member.', noResults: 'No one found' }
}

function MovieCard({ movie, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => { setHovered(true); prefetchMovie(movie.tmdb_id) }}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
        transform: hovered ? 'translateY(-5px)' : 'none',
        transition: 'transform 0.2s cubic-bezier(.2,.8,.3,1.2)'
      }}
    >
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          style={{
            width: '100%', borderRadius: '12px', display: 'block',
            boxShadow: hovered ? '0 14px 30px rgba(179,31,47,0.4)' : '0 6px 16px rgba(0,0,0,0.4)',
            border: '1px solid ' + (hovered ? 'rgba(220,60,79,0.5)' : 'rgba(255,255,255,0.08)'),
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
          }}
        />
      ) : (
        <div style={{
          width: '100%', height: '225px', backgroundColor: '#2a2a2a', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <span style={{ color: '#aaa' }}>No Poster</span>
        </div>
      )}
      <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.6rem', marginBottom: '0.15rem', fontWeight: 600 }}>{movie.title}</p>
      <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>{movie.year}</p>
    </div>
  )
}

function PersonCard({ person, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => { setHovered(true); prefetchPerson(person.id) }}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'center', cursor: 'pointer', borderRadius: '12px', padding: '0.9rem 0.5rem',
        backgroundColor: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
    >
      <img
        src={person.profile_url}
        alt={person.name}
        style={{
          width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', display: 'block',
          margin: '0 auto 0.6rem auto',
          border: '2px solid ' + (hovered ? '#dc3c4f' : 'rgba(255,255,255,0.12)'),
          boxShadow: hovered ? '0 10px 24px rgba(179,31,47,0.45)' : '0 4px 12px rgba(0,0,0,0.4)',
          transform: hovered ? 'scale(1.06)' : 'none',
          transition: 'transform 0.2s cubic-bezier(.2,.8,.3,1.2), box-shadow 0.2s ease, border-color 0.2s ease'
        }}
      />
      <p style={{ color: 'white', fontSize: '0.82rem', margin: '0 0 0.3rem 0', fontWeight: 700, lineHeight: '1.25' }}>{person.name}</p>
      <span style={{
        display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '999px',
        backgroundColor: person.department === 'Director' ? 'rgba(179,31,47,0.18)' : 'rgba(255,255,255,0.08)',
        color: person.department === 'Director' ? '#dc3c4f' : '#ccc',
        fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        marginBottom: '0.4rem'
      }}>
        {person.department}
      </span>
      {person.known_for && (
        <p style={{ color: '#888', fontSize: '0.72rem', margin: 0, lineHeight: '1.3' }}>{person.known_for}</p>
      )}
    </div>
  )
}

function SearchModal({ onClose, onMovieLogged, onWatchlistChange, onFavoriteChange, initialQuery = '', initialMode = 'movies' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(initialMode)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [closeHover, setCloseHover] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`${MODES[mode].endpoint}?q=${query}`)
        setResults(res.data)
      } catch (err) {
        setError('Search failed')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, mode])

  // Same "go back and reopen" contract goToPerson uses everywhere else in
  // the app (TMDBMovieModal, MovieDetailModal) — without backTo, the
  // person page's own "← Back" button falls through to a plain
  // navigate(-1), which isn't reliable here since the search modal itself
  // never changes the URL (it's just an overlay on the current page).
  // reopenSearch additionally carries the mode/query so "← Back" reopens
  // this same search — tab and typed letters intact — rather than just
  // landing back on a bare profile page.
  const goToPerson = (person) => {
    navigate(`/person/${person.id}`, {
      state: buildNavState(location, {
        initialPerson: { id: person.id, name: person.name, profile_url: person.profile_url },
        reopenSearch: { mode, query }
      })
    })
    onClose()
  }

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000, padding: '1rem',
        animation: 'searchModalFadeIn 0.2s ease'
      }}>
        <style>{`
          @keyframes searchModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes searchModalPopIn {
            from { opacity: 0; transform: translateY(16px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes searchResultsFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #1e1e1e 0%, #141414 100%)',
          padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '800px',
          maxHeight: '85dvh', overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(179,31,47,0.05)',
          animation: 'searchModalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '220px', height: '220px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(179,31,47,0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', position: 'relative' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'white', margin: 0, fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.3px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)', fontSize: '0.9rem', flexShrink: 0,
                boxShadow: '0 2px 10px rgba(179,31,47,0.5)'
              }}>
                <Emoji>🔍</Emoji>
              </span>
              Search
            </h2>
            <button
              onClick={onClose}
              onMouseEnter={() => setCloseHover(true)}
              onMouseLeave={() => setCloseHover(false)}
              style={{
                background: closeHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
                width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >✕</button>
          </div>

          {/* Movies / People switcher */}
          <div style={{
            position: 'relative', display: 'inline-flex', gap: '0.25rem',
            padding: '0.25rem', marginBottom: '1.25rem',
            backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: '11px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {Object.entries(MODES).map(([key, m]) => {
              const active = mode === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', borderRadius: '9px', border: 'none',
                    background: active ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : 'transparent',
                    color: active ? 'white' : '#999',
                    fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                    boxShadow: active ? '0 4px 12px rgba(179,31,47,0.45)' : 'none',
                    transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <Emoji>{m.icon}</Emoji>
                  {m.label}
                </button>
              )
            })}
          </div>

          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: inputFocused ? '#dc3c4f' : '#666', fontSize: '1rem', transition: 'color 0.2s' }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={MODES[mode].placeholder}
              autoFocus
              style={{
                width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem', borderRadius: '12px',
                border: '1px solid ' + (inputFocused ? '#b31f2f' : 'rgba(255,255,255,0.1)'),
                backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
                boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none',
                boxShadow: inputFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
          </div>

          {!query.trim() && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}><Emoji>{MODES[mode].icon}</Emoji></p>
              <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>{MODES[mode].empty}</p>
            </div>
          )}

          {loading && (
            <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 1rem 0' }}>Searching...</p>
          )}
          {error && (
            <p style={{
              color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.08)',
              border: '1px solid rgba(179,31,47,0.2)', borderRadius: '8px',
              padding: '0.6rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem'
            }}>{error}</p>
          )}

          {!loading && query.trim() && results.length === 0 && !error && (
            <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>{MODES[mode].noResults} for "{query}"</p>
          )}

          {results.length > 0 && (
            <div
              key={mode}
              style={{
                display: 'grid',
                // Fixed 2-column pairs on mobile — auto-fill's minmax floors
                // (130/150px) are wide enough that a narrow phone screen
                // only ever fits one column, so results run one-by-one down
                // the page instead of side by side.
                gridTemplateColumns: isMobile
                  ? '1fr 1fr'
                  : (mode === 'people' ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))'),
                gap: isMobile ? '0.75rem' : '1rem',
                animation: 'searchResultsFadeIn 0.18s ease'
              }}
            >
              {mode === 'movies'
                ? results.map(movie => (
                  <MovieCard key={movie.tmdb_id} movie={movie} onSelect={() => setSelectedMovie(movie)} />
                ))
                : results.map(person => (
                  <PersonCard key={person.id} person={person} onSelect={() => goToPerson(person)} />
                ))}
            </div>
          )}
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
