import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SearchModal from '../Movies/SearchModal'
import MovieDetailModal from '../Movies/MovieDetailModal'

function Profile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
    fetchWatchedMovies()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile')
      setUser(res.data)
    } catch (err) {
      setError('Failed to load profile')
    }
  }

  const fetchWatchedMovies = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const res = await api.get(`/watched/user/${userData.userId}`)
      setWatchedMovies(res.data)
    } catch (err) {
      console.error('Failed to load watched movies')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🎬 MovieBook</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              padding: '0.5rem 1rem', backgroundColor: '#e50914',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            🔍 Search Movies
          </button>
          <button
            onClick={() => navigate('/feed')}
            style={{
              padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', cursor: 'pointer'
            }}
          >
            🌍 Community Feed
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem', backgroundColor: 'transparent',
              color: '#aaa', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: '#e50914',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0
          }}>
            {(user.username || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{user.username || user.email}</h2>
            <p style={{ color: '#aaa', margin: 0 }}>Member since {formatDate(user.createdAt)}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{watchedMovies.length}</p>
            <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Movies Watched</p>
          </div>
        </div>

        {/* Watched Movies */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>My Watched Movies</h3>
        {watchedMovies.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ color: '#aaa' }}>No watched movies yet. Search and log some movies!</p>
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
                  <img
                    src={movie.movie_poster}
                    alt={movie.movie_title}
                    style={{ width: '100%', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '225px', backgroundColor: '#1a1a1a',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: '#aaa' }}>No Poster</span>
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{movie.movie_title}</p>
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>⭐ {movie.rating}/5</p>
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

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onMovieLogged={fetchWatchedMovies}
        />
      )}
    </div>
  )
}

export default Profile