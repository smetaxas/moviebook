import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function CommunityFeed() {
  const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get('/watched')
        setWatchedMovies(res.data)
      } catch (err) {
        console.error('Failed to load feed')
      } finally {
        setLoading(false)
      }
    }
    fetchFeed()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2>Community Feed</h2>
      <button onClick={() => navigate('/profile')}>My Profile</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {watchedMovies.map(movie => (
          <div key={movie._id} style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
            {movie.movie_poster && (
              <img src={movie.movie_poster} alt={movie.movie_title} style={{ width: '80px', borderRadius: '4px' }} />
            )}
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>{movie.movie_title}</h3>
              <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>⭐ {movie.rating}/5</p>
              {movie.review && <p style={{ margin: '0 0 0.25rem 0' }}>{movie.review}</p>}
              <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
                by {movie.user_id?.email} · {formatDate(movie.watchedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {watchedMovies.length === 0 && (
        <p style={{ color: '#aaa' }}>No movies logged yet!</p>
      )}
    </div>
  )
}

export default CommunityFeed