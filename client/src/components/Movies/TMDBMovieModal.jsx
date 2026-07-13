import { useState, useEffect } from 'react'
import api from '../../api/axios'

function TMDBMovieModal({ movie, onClose, onLogMovie }) {
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/movies/tmdb/${movie.tmdb_id}`)
        setTmdbMovie(res.data)
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', padding: '2rem',
        borderRadius: '8px', width: '90%', maxWidth: '700px',
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Movie Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {loading && <p style={{ color: 'white' }}>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {tmdbMovie && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {tmdbMovie.poster_url && (
              <img src={tmdbMovie.poster_url} alt={tmdbMovie.title} style={{ width: '150px', borderRadius: '4px', flexShrink: 0 }} />
            )}
            <div>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{tmdbMovie.title} ({tmdbMovie.year})</h3>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎬 {tmdbMovie.director}</p>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎭 {tmdbMovie.genres.join(', ')}</p>
              <p style={{ color: '#aaa', margin: '0 0 0.75rem 0' }}>⏱ {tmdbMovie.runtime} min</p>
              <p style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{tmdbMovie.description}</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                {tmdbMovie.trailer_key && (
                  <a
                    href={`https://www.youtube.com/watch?v=${tmdbMovie.trailer_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#e50914', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
                  >
                    ▶ Watch Trailer
                  </a>
                )}
                <button
                  onClick={() => onLogMovie(movie)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Log Movie
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TMDBMovieModal