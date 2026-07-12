import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SearchModal from '../Movies/SearchModal'

function Profile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
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
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (error) return <p>{error}</p>
  if (!user) return <p>Loading...</p>

  return (
    <div>
      <h2>My Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
      <button onClick={() => setShowSearch(true)}>Search Movies</button>
      <button onClick={handleLogout}>Logout</button>

      <h3>My Watched Movies ({watchedMovies.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {watchedMovies.map(movie => (
          <div key={movie._id} style={{ textAlign: 'center', cursor: 'pointer' }}>
            {movie.movie_poster ? (
              <img
                src={movie.movie_poster}
                alt={movie.movie_title}
                style={{ width: '100%', borderRadius: '4px' }}
              />
            ) : (
              <div style={{ width: '100%', height: '225px', backgroundColor: '#2a2a2a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white' }}>No Poster</span>
              </div>
            )}
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{movie.movie_title}</p>
            <p style={{ fontSize: '0.75rem', color: '#aaa' }}>⭐ {movie.rating}/5</p>
          </div>
        ))}
      </div>

      {watchedMovies.length === 0 && (
        <p style={{ color: '#aaa' }}>No watched movies yet. Search and log some movies!</p>
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