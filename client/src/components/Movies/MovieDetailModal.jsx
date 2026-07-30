import { useState, useEffect } from 'react'
import api from '../../api/axios'
import ConfirmModal from '../UI/ConfirmModal'

function MovieDetailModal({ watchedMovieId, onClose, onUserClick, onDeleted, onRatingUpdated }) {
  const [watchedMovie, setWatchedMovie] = useState(null)
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(null)
  const [ratingUpdated, setRatingUpdated] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [watchedRes, commentsRes] = await Promise.all([
        api.get(`/watched/id/${watchedMovieId}`),
        api.get(`/comments/${watchedMovieId}`)
      ])
      setWatchedMovie(watchedRes.data)
      setRating(watchedRes.data.rating)
      setComments(commentsRes.data)

      const tmdbRes = await api.get(`/movies/tmdb/${watchedRes.data.movie_id}`)
      setTmdbMovie(tmdbRes.data)
    } catch (err) {
      setError('Failed to load movie details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRating = async () => {
    try {
      await api.patch(`/watched/${watchedMovieId}/rating`, { rating })
      setWatchedMovie(prev => ({ ...prev, rating }))
      setRatingUpdated(true)
      onRatingUpdated && onRatingUpdated()
      setTimeout(() => setRatingUpdated(false), 2000)
    } catch (err) {
      setError('Failed to update rating')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/watched/${watchedMovieId}`)
      onDeleted && onDeleted()
      onClose()
    } catch (err) {
      setError('Failed to delete movie')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const res = await api.post(`/comments/${watchedMovieId}`, { comment: newComment })
      setComments([res.data, ...comments])
      setNewComment('')
    } catch (err) {
      setError('Failed to add comment')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const isOwner = watchedMovie?.user_id === currentUserId || watchedMovie?.user_id?._id === currentUserId

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: '#1a1a1a', padding: '2rem',
          borderRadius: '8px', width: '90%', maxWidth: '900px',
          maxHeight: '85vh', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Movie Details</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          {loading && <p style={{ color: 'white' }}>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {watchedMovie && (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {watchedMovie.movie_poster && (
                  <img src={watchedMovie.movie_poster} alt={watchedMovie.movie_title} style={{ width: '250px', borderRadius: '8px', flexShrink: 0, objectFit: 'contain' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{watchedMovie.movie_title} ({watchedMovie.movie_year})</h3>
                  {tmdbMovie && (
                    <>
                      <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎬 {tmdbMovie.director}</p>
                      <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎭 {tmdbMovie.genres.join(', ')}</p>
                      <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>⏱ {tmdbMovie.runtime} min</p>
                      {tmdbMovie.release_date && (
                        <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>📅 {formatDate(tmdbMovie.release_date)}</p>
                      )}
                      <p style={{ color: 'white', margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>{tmdbMovie.description}</p>
                    </>
                  )}

                  {/* Where to Watch */}
                  <div style={{ marginBottom: '1rem' }}>
                    <a
                      href={`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(watchedMovie.movie_title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      📺 Where to Watch
                    </a>
                  </div>

                  {isOwner ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'white' }}>⭐ Rating:</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                          style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
                        />
                        <button
                          onClick={handleUpdateRating}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {ratingUpdated ? '✓ Saved!' : 'Update'}
                        </button>
                      </div>
                      <button
                        onClick={() => setShowConfirm(true)}
                        style={{ padding: '0.4rem 0.75rem', backgroundColor: 'transparent', color: '#e50914', border: '1px solid #e50914', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🗑️ Remove Movie
                      </button>
                    </>
                  ) : (
                    <p style={{ color: 'white', margin: '0 0 0.25rem 0' }}>⭐ {watchedMovie.rating}/5</p>
                  )}

                  <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>Watched: {formatDate(watchedMovie.watchedAt)}</p>
                </div>
              </div>

              <hr style={{ borderColor: '#333', marginBottom: '1.5rem' }} />

              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Comments ({comments.length})</h3>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  maxLength={500}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Post
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {comments.map(comment => (
                  <div key={comment._id} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {comment.commenter_id?.profile_photo ? (
                        <img src={comment.commenter_id.profile_photo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {(comment.commenter_id?.username || comment.commenter_id?.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span
                        style={{ color: '#aaa', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => onUserClick && onUserClick(comment.commenter_id?._id)}
                      >
                        {comment.commenter_id?.username || comment.commenter_id?.email}
                      </span>
                      <span style={{ color: '#555', fontSize: '0.75rem' }}>· {formatDate(comment.createdAt)}</span>
                    </div>
                    <p style={{ color: 'white', margin: 0 }}>{comment.comment}</p>
                  </div>
                ))}
                {comments.length === 0 && <p style={{ color: '#aaa' }}>No comments yet!</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          icon="🎬"
          title="Remove Movie"
          message="Are you sure you want to remove this movie from your list?"
          confirmText="Remove"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}

export default MovieDetailModal