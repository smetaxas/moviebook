import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'

function UserProfile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [selectedWatchlistMovie, setSelectedWatchlistMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [error, setError] = useState('')
  const { userId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
    fetchWatchedMovies()
    fetchWatchlist()
  }, [userId])

  const fetchUser = async () => {
    try {
      const res = await api.get(`/user/profile/${userId}`)
      setUser(res.data)
    } catch (err) {
      setError('User not found')
    }
  }

  const fetchWatchedMovies = async () => {
    try {
      const res = await api.get(`/user/profile/${userId}/watched`)
      setWatchedMovies(res.data)
    } catch (err) {
      console.error('Failed to load watched movies')
    }
  }

  const fetchWatchlist = async () => {
    try {
      const res = await api.get(`/watchlist/user/${userId}`)
      setWatchlist(res.data)
    } catch (err) {
      console.error('Failed to load watchlist')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (error) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>{error}</p>
  if (!user) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      {/* Navbar */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(229,9,20,0.3)',
        padding: '0 2rem', height: '84px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="CineLog" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          ← Back
        </button>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Info */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '2rem', marginBottom: '2rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem'
        }}>
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
              {(user.username || user.email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{user.username || user.email}</h2>
            <p style={{ color: '#aaa', margin: 0 }}>Member since {formatDate(user.createdAt)}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{watchedMovies.length}</p>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Movies Watched</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{watchlist.length}</p>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>To Watch</p>
            </div>
          </div>
        </div>

        {/* Watched Movies */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Watched Movies</h3>
        {watchedMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>⭐ {movie.rating}/5</p>
              </div>
            ))}
          </div>
        )}

        {/* Watchlist */}
        <h3 style={{ margin: '2rem 0 1rem 0', fontSize: '1.2rem' }}>🎯 Movies to Watch</h3>
        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#aaa' }}>No movies in the watchlist yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {watchlist.map(movie => (
              <div
                key={movie._id}
                onClick={() => setSelectedWatchlistMovie({
                  tmdb_id: movie.movie_id,
                  title: movie.movie_title,
                  poster_url: movie.movie_poster,
                  year: movie.movie_year
                })}
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
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>{movie.movie_year}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie}
          onClose={() => setSelectedWatchedMovie(null)}
        />
      )}

      {selectedWatchlistMovie && (
        <TMDBMovieModal
          movie={selectedWatchlistMovie}
          onClose={() => setSelectedWatchlistMovie(null)}
          onLogMovie={(movie) => {
            setSelectedWatchlistMovie(null)
            setMovieToLog(movie)
          }}
        />
      )}

      {movieToLog && (
        <LogMovieModal
          movie={movieToLog}
          onClose={() => setMovieToLog(null)}
          onLogged={() => setMovieToLog(null)}
        />
      )}
    </div>
  )
}

export default UserProfile