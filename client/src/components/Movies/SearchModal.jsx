import { useState, useEffect } from 'react'
import api from '../../api/axios'
import LogMovieModal from './LogMovieModal'
import TMDBMovieModal from './TMDBMovieModal'
import Emoji from '../UI/Emoji'

function SearchModal({ onClose, onMovieLogged, onWatchlistChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [closeHover, setCloseHover] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/movies/search?q=${query}`)
        setResults(res.data)
      } catch (err) {
        setError('Search failed')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

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
        `}</style>

        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #1e1e1e 0%, #141414 100%)',
          padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '800px',
          maxHeight: '85vh', overflowY: 'auto',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.3px' }}>
              <Emoji>🔍</Emoji> Search Movies
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

          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: inputFocused ? '#dc3c4f' : '#666', fontSize: '1rem', transition: 'color 0.2s' }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Search for a movie..."
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
              <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}><Emoji>🎬</Emoji></p>
              <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Start typing to find a movie to log or add to your watchlist.</p>
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
            <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>No movies found for "{query}"</p>
          )}

          {results.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {results.map(movie => (
                <div
                  key={movie.tmdb_id}
                  onClick={() => setSelectedMovie(movie)}
                  style={{ textAlign: 'center', cursor: 'pointer', borderRadius: '10px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '225px', backgroundColor: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#aaa' }}>No Poster</span>
                    </div>
                  )}
                  <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.15rem', fontWeight: 600 }}>{movie.title}</p>
                  <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>{movie.year}</p>
                </div>
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
