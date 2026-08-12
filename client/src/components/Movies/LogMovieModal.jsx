import { useState } from 'react'
import api from '../../api/axios'

const RATING_LABELS = { 1: 'Not for me', 2: 'It was okay', 3: 'Liked it', 4: 'Really liked it', 5: 'Loved it!' }

function LogMovieModal({ movie, onClose, onLogged }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
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
        rating
      })
      onLogged()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, animation: 'logModalFadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes logModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes logModalPopIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes starPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #1e1e1e 0%, #141414 100%)',
        padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '440px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,9,20,0.05)',
        animation: 'logModalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Ambient glow accent */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,9,20,0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.3px' }}>Log Movie</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
          >✕</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', position: 'relative' }}>
          {movie.poster_url && (
            <img
              src={movie.poster_url} alt={movie.title}
              style={{ width: '76px', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)', flexShrink: 0 }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ color: 'white', margin: '0 0 0.25rem 0', fontSize: '1.1rem', lineHeight: 1.25 }}>{movie.title}</h3>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>{movie.year}</p>
          </div>
        </div>

        {error && (
          <p style={{
            color: '#ff6b6b', backgroundColor: 'rgba(255,0,0,0.08)',
            border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px',
            padding: '0.6rem 0.8rem', fontSize: '0.85rem', marginTop: 0
          }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              How was it?
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '2.4rem', lineHeight: 1, padding: '0.15rem',
                    color: star <= displayRating ? '#e50914' : '#3a3a3a',
                    textShadow: star <= displayRating ? '0 0 16px rgba(229,9,20,0.5)' : 'none',
                    transition: 'color 0.15s, text-shadow 0.15s',
                    animation: star === rating && star <= displayRating ? 'starPop 0.3s ease' : 'none'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <p style={{ color: '#e50914', fontSize: '0.9rem', fontWeight: '600', marginTop: '0.75rem', minHeight: '1.2em' }}>
              {RATING_LABELS[displayRating] || ''}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem', backgroundColor: '#e50914', color: 'white',
              border: 'none', borderRadius: '10px', cursor: loading ? 'default' : 'pointer',
              fontSize: '1rem', fontWeight: '700', letterSpacing: '0.2px',
              boxShadow: '0 8px 24px rgba(229,9,20,0.35)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(229,9,20,0.5)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,9,20,0.35)' }}
          >
            {loading ? 'Logging...' : 'Add to Watched Movies'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LogMovieModal