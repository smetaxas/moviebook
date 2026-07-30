import { useState, useEffect } from 'react'
import api from '../../api/axios'

function TMDBMovieModal({ movie, onClose, onLogMovie, hideLog, onWatchlistChange }) {
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistId, setWatchlistId] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [tmdbRes, watchlistRes] = await Promise.all([
          api.get(`/movies/tmdb/${movie.tmdb_id}`),
          api.get(`/watchlist/check/${movie.tmdb_id}`)
        ])
        setTmdbMovie(tmdbRes.data)
        setInWatchlist(watchlistRes.data.inWatchlist)
        setWatchlistId(watchlistRes.data.id)
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [])

  const handleWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${watchlistId}`)
        setInWatchlist(false)
        setWatchlistId(null)
      } else {
        const res = await api.post('/watchlist', {
          movie_id: String(movie.tmdb_id),
          movie_title: tmdbMovie.title,
          movie_poster: tmdbMovie.poster_url,
          movie_year: tmdbMovie.year
        })
        setInWatchlist(true)
        setWatchlistId(res.data._id)
      }
      onWatchlistChange && onWatchlistChange()
    } catch (err) {
      console.error('Watchlist error', err)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

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
        borderRadius: '8px', width: '90%', maxWidth: '900px',
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Movie Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>x</button>
        </div>

        {loading && <p style={{ color: 'white' }}>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {tmdbMovie && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {tmdbMovie.poster_url && (
              <img src={tmdbMovie.poster_url} alt={tmdbMovie.title} style={{ width: '250px', borderRadius: '8px', flexShrink: 0, objectFit: 'contain' }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{tmdbMovie.title} ({tmdbMovie.year})</h3>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎬 {tmdbMovie.director}</p>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎭 {tmdbMovie.genres.join(', ')}</p>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>⏱ {tmdbMovie.runtime} min</p>
              {tmdbMovie.release_date && (
                <p style={{ color: '#aaa', margin: '0 0 0.75rem 0' }}>📅 {formatDate(tmdbMovie.release_date)}</p>
              )}
              <p style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{tmdbMovie.description}</p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {!hideLog && (
                  <button
                    onClick={() => onLogMovie(movie)}
                    style={{ padding: '0.6rem 1.25rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Log Movie
                  </button>
                )}
                <button
                  onClick={handleWatchlist}
                  disabled={watchlistLoading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: inWatchlist ? 'rgba(0,200,0,0.15)' : 'rgba(255,255,255,0.08)',
                    color: inWatchlist ? '#00c800' : 'white',
                    border: '1px solid ' + (inWatchlist ? '#00c800' : 'rgba(255,255,255,0.2)'),
                    borderRadius: '4px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  {watchlistLoading ? '...' : inWatchlist ? 'In Watchlist' : '+ Watchlist'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <a
                  href={'https://www.google.com/search?q=where+to+watch+' + encodeURIComponent(tmdbMovie.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  📺 Where to Watch
                </a>
                {tmdbMovie.trailer_key && (
                  <a
                    href={'https://www.youtube.com/watch?v=' + tmdbMovie.trailer_key}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#333', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
                  >
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TMDBMovieModal