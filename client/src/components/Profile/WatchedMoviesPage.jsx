import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import MovieDetailModal from '../Movies/MovieDetailModal'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
import ScrollToTopButton from '../UI/ScrollToTopButton'

function WatchedMoviesPage() {
  const [watchedMovies, setWatchedMovies] = useState([])
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchWatchedMovies()
  }, [])

  const fetchWatchedMovies = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const res = await api.get(`/watched/user/${userData.userId}`)
      setWatchedMovies(res.data)
    } catch (err) {
      setError('Failed to load watched movies')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (error) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>{error}</p>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <NavButton onClick={() => navigate('/profile')}>
          ← Back to Profile
        </NavButton>
      </Navbar>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <p style={{ color: '#b31f2f', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
              Watched Library
            </p>
            <h1 style={{ margin: 0, fontSize: '1.6rem' }}>My Watched Movies</h1>
            <p style={{ color: '#aaa', margin: '0.35rem 0 0 0' }}>Everything you have logged, in one place.</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{watchedMovies.length}</p>
            <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Movies Watched</p>
          </div>
        </div>

        {watchedMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ color: '#aaa' }}>No watched movies yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {watchedMovies.map(movie => (
              <div
                key={movie._id}
                onClick={() => setSelectedWatchedMovie(movie._id)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {movie.movie_poster ? (
                  <img src={movie.movie_poster} alt={movie.movie_title} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '225px', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#aaa' }}>No Poster</span>
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{movie.movie_title}</p>
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>
                  ⭐ {movie.rating}/5
                  {movie.watched_at ? ` • ${formatDate(movie.watched_at)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie}
          onClose={() => setSelectedWatchedMovie(null)}
          onDeleted={fetchWatchedMovies}
          onRatingUpdated={fetchWatchedMovies}
        />
      )}

      <ScrollToTopButton />
    </div>
  )
}

export default WatchedMoviesPage