import { useState, useEffect } from 'react'
import api from '../../api/axios'
import LogMovieModal from './LogMovieModal'
import TMDBMovieModal from './TMDBMovieModal'

function SearchModal({ onClose, onMovieLogged }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)

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
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1a1a1a', padding: '2rem',
          borderRadius: '8px', width: '90%', maxWidth: '800px',
          maxHeight: '80vh', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Search Movies</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            autoFocus
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', marginBottom: '1.5rem', boxSizing: 'border-box' }}
          />

          {loading && <p style={{ color: 'white' }}>Searching...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {results.map(movie => (
              <div
                key={movie.tmdb_id}
                onClick={() => setSelectedMovie(movie)}
                style={{ textAlign: 'center', cursor: 'pointer' }}
              >
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    style={{ width: '100%', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '225px', backgroundColor: '#2a2a2a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white' }}>No Poster</span>
                  </div>
                )}
                <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.5rem' }}>{movie.title}</p>
                <p style={{ color: '#aaa', fontSize: '0.75rem' }}>{movie.year}</p>
              </div>
            ))}
          </div>

          {results.length === 0 && query && !loading && (
            <p style={{ color: '#aaa', textAlign: 'center' }}>No movies found</p>
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