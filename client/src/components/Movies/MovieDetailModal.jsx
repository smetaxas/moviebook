import { useState, useEffect } from 'react'
import api from '../../api/axios'

function MovieDetailModal({ watchedMovieId, onClose, onUserClick }) {
  const [watchedMovie, setWatchedMovie] = useState(null)
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      setComments(commentsRes.data)

      const tmdbRes = await api.get(`/movies/tmdb/${watchedRes.data.movie_id}`)
      setTmdbMovie(tmdbRes.data)
    } catch (err) {
      setError('Failed to load movie details')
    } finally {
      setLoading(false)
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
        borderRadius: '8px', width: '90%', maxWidth: '700px',
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Movie Detail</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {loading && <p style={{ color: 'white' }}>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {watchedMovie && (
          <>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {watchedMovie.movie_poster && (
                <img src={watchedMovie.movie_poster} alt={watchedMovie.movie_title} style={{ width: '150px', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{watchedMovie.movie_title} ({watchedMovie.movie_year})</h3>
                {tmdbMovie && (
                  <>
                    <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎬 {tmdbMovie.director}</p>
                    <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>🎭 {tmdbMovie.genres.join(', ')}</p>
                    <p style={{ color: '#aaa', margin: '0 0 0.25rem 0' }}>⏱ {tmdbMovie.runtime} min</p>
                    <p style={{ color: 'white', margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>{tmdbMovie.description}</p>
                  </>
                )}
                <p style={{ color: 'white', margin: '0 0 0.25rem 0' }}>⭐ {watchedMovie.rating}/5</p>
                {watchedMovie.review && <p style={{ color: 'white', margin: '0 0 0.25rem 0', fontStyle: 'italic' }}>"{watchedMovie.review}"</p>}
                <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>Watched: {formatDate(watchedMovie.watchedAt)}</p>
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
                  <p style={{ color: 'white', margin: '0 0 0.25rem 0' }}>{comment.comment}</p>
                  <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>
                    <span
                      onClick={() => onUserClick && onUserClick(comment.commenter_id?._id)}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {comment.commenter_id?.email}
                    </span>
                    {' · '}{formatDate(comment.createdAt)}
                  </p>
                </div>
              ))}
              {comments.length === 0 && <p style={{ color: '#aaa' }}>No comments yet!</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MovieDetailModal