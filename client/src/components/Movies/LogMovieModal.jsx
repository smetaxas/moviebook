import { useState } from 'react'
import api from '../../api/axios'

function LogMovieModal({ movie, onClose, onLogged }) {
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/watched', {
        movie_id: String(movie.tmdb_id),
        movie_title: movie.title,
        movie_poster: movie.poster_url,
        movie_year: movie.year,
        rating,
        review
      })
      onLogged()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', padding: '2rem',
        borderRadius: '8px', width: '90%', maxWidth: '500px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Log Movie</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {movie.poster_url && (
            <img src={movie.poster_url} alt={movie.title} style={{ width: '80px', borderRadius: '4px' }} />
          )}
          <div>
            <h3 style={{ color: 'white', margin: '0 0 0.25rem 0' }}>{movie.title}</h3>
            <p style={{ color: '#aaa', margin: 0 }}>{movie.year}</p>
          </div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Rating (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Review (optional):</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={1000}
              rows={4}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
          >
            {loading ? 'Logging...' : 'Log Movie'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LogMovieModal