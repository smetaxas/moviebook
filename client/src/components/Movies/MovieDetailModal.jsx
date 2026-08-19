import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import ConfirmModal from '../UI/ConfirmModal'
import Emoji from '../UI/Emoji'
import GiphyPicker from '../UI/GiphyPicker'
import Avatar from '../UI/Avatar'

const RATING_LABELS = { 1: 'Not for me', 2: 'It was okay', 3: 'Liked it', 4: 'Really liked it', 5: 'Loved it!' }

const StarRating = ({ rating, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: '1px', verticalAlign: 'middle' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#dc3c4f' : 'rgba(255,255,255,0.15)' }}>★</span>
    ))}
  </span>
)

function MovieDetailModal({ watchedMovieId, onClose, onDeleted, onRatingUpdated }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [watchedMovie, setWatchedMovie] = useState(null)
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentFocused, setCommentFocused] = useState(false)
  const [showGiphy, setShowGiphy] = useState(false)
  const [selectedGif, setSelectedGif] = useState(null)
  const [gifButtonHover, setGifButtonHover] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingUpdated, setRatingUpdated] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [closeHover, setCloseHover] = useState(false)

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  const goToUser = (userId) => {
    navigate(`/user/${userId}`, { state: { backTo: location.pathname, reopenWatchedMovie: watchedMovieId } })
  }

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
    if (!newComment.trim() && !selectedGif) return
    try {
      const res = await api.post(`/comments/${watchedMovieId}`, { comment: newComment, gif_url: selectedGif })
      setComments([res.data, ...comments])
      setNewComment('')
      setSelectedGif(null)
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
  const imdbScore = tmdbMovie?.ratings?.imdb ? parseFloat(tmdbMovie.ratings.imdb) : null
  const rtScore = tmdbMovie?.ratings?.rotten_tomatoes ? parseInt(tmdbMovie.ratings.rotten_tomatoes, 10) : null
  const metaScore = tmdbMovie?.ratings?.metacritic ? parseInt(tmdbMovie.ratings.metacritic, 10) : null
  const metaColor = metaScore == null ? '#888' : metaScore >= 61 ? '#6c3' : metaScore >= 40 ? '#fc3' : '#f33'
  const displayRating = hoverRating || rating || 0

  const metaLine = tmdbMovie
    ? [tmdbMovie.director, tmdbMovie.genres?.join(', '), tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : null, tmdbMovie.release_date ? formatDate(tmdbMovie.release_date) : null]
        .filter(Boolean)
    : []

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000, padding: '1rem',
        animation: 'movieModalFadeIn 0.2s ease'
      }}>
        <style>{`
          @keyframes movieModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes movieModalPopIn {
            from { opacity: 0; transform: translateY(16px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div style={{
          backgroundColor: '#1a1a1a', borderRadius: '16px',
          width: '100%', maxWidth: '900px',
          maxHeight: '90vh', overflowY: 'auto',
          position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          animation: 'movieModalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: closeHover ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
              border: '1px solid ' + (closeHover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'),
              color: 'white', fontSize: '1.1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s',
              transform: closeHover ? 'scale(1.08)' : 'scale(1)'
            }}
          >
            ✕
          </button>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', animation: 'pulse 1.4s ease-in-out infinite' }}><Emoji>🎬</Emoji></p>
              <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Loading movie details...</p>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          )}
          {error && <p style={{ color: '#dc3c4f', padding: '2rem' }}>{error}</p>}

          {watchedMovie && (
            <>
              {/* Backdrop */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                {tmdbMovie?.backdrop_url && (
                  <img
                    src={tmdbMovie.backdrop_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.75) 65%, #1a1a1a 100%)'
                }} />
              </div>

              {/* Poster + title, overlapping the backdrop */}
              <div style={{ display: 'flex', gap: '1.5rem', padding: '0 2rem', marginTop: '-130px', position: 'relative', zIndex: 2 }}>
                {watchedMovie.movie_poster && (
                  <img
                    src={watchedMovie.movie_poster}
                    alt={watchedMovie.movie_title}
                    style={{ width: '160px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}
                  />
                )}
                <div style={{ flex: 1, paddingTop: '132px', minWidth: 0 }}>
                  <h2 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: '800' }}>
                    {watchedMovie.movie_title} <span style={{ color: '#aaa', fontWeight: '400' }}>({watchedMovie.movie_year})</span>
                  </h2>
                  {metaLine.length > 0 && (
                    <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                      {metaLine.join('  ·  ')}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
                {tmdbMovie && (
                  <>
                    {/* Ratings */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {tmdbMovie.imdb_id && (
                        <a
                          href={`https://www.imdb.com/title/${tmdbMovie.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.35rem 0.7rem',
                            backgroundColor: imdbScore != null ? 'rgba(245,197,24,0.12)' : 'transparent',
                            border: '1px solid rgba(245,197,24,0.45)',
                            borderRadius: '6px', color: '#f5c518', textDecoration: 'none',
                            fontWeight: '700', fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ backgroundColor: '#f5c518', color: '#000', borderRadius: '3px', padding: '0 4px', fontSize: '0.7rem' }}>IMDb</span>
                          {imdbScore != null ? `${imdbScore.toFixed(1)}/10` : 'N/A'}
                        </a>
                      )}
                      <a
                        href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(tmdbMovie.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.7rem',
                          backgroundColor: rtScore == null ? 'transparent' : (rtScore >= 60 ? 'rgba(250,50,10,0.12)' : 'rgba(112,168,80,0.12)'),
                          border: '1px solid ' + (rtScore == null ? 'rgba(255,255,255,0.15)' : (rtScore >= 60 ? 'rgba(250,50,10,0.45)' : 'rgba(112,168,80,0.45)')),
                          borderRadius: '6px', color: rtScore == null ? '#888' : (rtScore >= 60 ? '#fa320a' : '#70a850'),
                          textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem'
                        }}
                      >
                        <Emoji>{rtScore == null ? '🍅' : (rtScore >= 60 ? '🍅' : '🤢')}</Emoji> {rtScore != null ? `${rtScore}%` : 'N/A'}
                      </a>
                      {metaScore != null && (
                        <a
                          href={`https://www.metacritic.com/search/${encodeURIComponent(tmdbMovie.title)}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.35rem 0.7rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px', color: '#ddd', textDecoration: 'none',
                            fontWeight: '700', fontSize: '0.85rem'
                          }}
                        >
                          <span style={{ backgroundColor: metaColor, color: '#000', borderRadius: '3px', padding: '0 5px', fontSize: '0.75rem', fontWeight: '800' }}>
                            {metaScore}
                          </span>
                          Metacritic
                        </a>
                      )}
                    </div>

                    {tmdbMovie.description && (
                      <p style={{ color: 'white', margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {tmdbMovie.description}
                      </p>
                    )}

                    {/* Cast */}
                    {tmdbMovie.cast?.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'white', margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Cast</h4>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {tmdbMovie.cast.map((member, i) => (
                            <div key={i} style={{ flexShrink: 0, width: '76px', textAlign: 'center' }}>
                              {member.profile_url ? (
                                <img
                                  src={member.profile_url}
                                  alt={member.name}
                                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.4rem' }}
                                />
                              ) : (
                                <div style={{
                                  width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#333',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#aaa', fontWeight: '700', fontSize: '1.2rem', lineHeight: 1, margin: '0 auto 0.4rem auto'
                                }}>
                                  {member.name?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <p style={{ color: 'white', fontSize: '0.75rem', margin: '0 0 0.15rem 0', fontWeight: '600', lineHeight: '1.2' }}>{member.name}</p>
                              <p style={{ color: '#888', fontSize: '0.7rem', margin: 0, lineHeight: '1.2' }}>{member.character}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                      <a
                        href={`https://www.google.com/search?q=where+to+watch+${encodeURIComponent(watchedMovie.movie_title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.6rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}
                      >
                        <Emoji>📺</Emoji> Where to Watch
                      </a>
                    </div>
                  </>
                )}

                {/* Rating panel */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(179,31,47,0.08) 0%, rgba(255,255,255,0.03) 60%)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                  padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
                }}>
                  {isOwner ? (
                    <>
                      <p style={{ color: '#999', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 0.75rem 0' }}>Your Rating</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.15rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: '1.6rem', lineHeight: 1, padding: '0.1rem',
                                  color: star <= displayRating ? '#dc3c4f' : 'rgba(255,255,255,0.15)',
                                  textShadow: star <= displayRating ? '0 0 12px rgba(179,31,47,0.5)' : 'none',
                                  transition: 'color 0.15s, text-shadow 0.15s'
                                }}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <p style={{ color: '#dc3c4f', fontSize: '0.8rem', fontWeight: 600, margin: '0.35rem 0 0 0', minHeight: '1.1em' }}>
                            {RATING_LABELS[displayRating] || ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                          <button
                            onClick={handleUpdateRating}
                            disabled={rating === watchedMovie.rating}
                            style={{
                              padding: '0.55rem 1.1rem', backgroundColor: '#b31f2f', color: 'white', border: 'none',
                              borderRadius: '999px', cursor: rating === watchedMovie.rating ? 'default' : 'pointer', fontWeight: '700', fontSize: '0.85rem',
                              opacity: rating === watchedMovie.rating ? 0.5 : 1, transition: 'opacity 0.15s'
                            }}
                          >
                            {ratingUpdated ? <Emoji>✓ Saved!</Emoji> : 'Save'}
                          </button>
                          <button
                            onClick={() => setShowConfirm(true)}
                            style={{ padding: '0.55rem 1rem', backgroundColor: 'transparent', color: '#dc3c4f', border: '1px solid rgba(179,31,47,0.5)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <Emoji>🗑️</Emoji> Remove
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <StarRating rating={watchedMovie.rating} size={20} />
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{watchedMovie.rating}/5</span>
                    </div>
                  )}
                  <p style={{ color: '#888', fontSize: '0.78rem', margin: '0.85rem 0 0 0' }}>Watched {formatDate(watchedMovie.watchedAt)}</p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} />

                <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}><Emoji>💬</Emoji> Comments ({comments.length})</h3>

                {selectedGif && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
                    <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: '120px', borderRadius: '10px', display: 'block' }} />
                    <button
                      type="button"
                      onClick={() => setSelectedGif(null)}
                      aria-label="Remove GIF"
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px',
                        borderRadius: '50%', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', fontSize: '0.75rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setCommentFocused(true)}
                    onBlur={() => setCommentFocused(false)}
                    placeholder="Add a comment..."
                    maxLength={500}
                    style={{
                      flex: 1, padding: '0.6rem 0.9rem', borderRadius: '999px',
                      border: '1px solid ' + (commentFocused ? '#b31f2f' : 'rgba(255,255,255,0.1)'),
                      backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem',
                      boxShadow: commentFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                  />

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowGiphy(v => !v)}
                      onMouseEnter={() => setGifButtonHover(true)}
                      onMouseLeave={() => setGifButtonHover(false)}
                      aria-label="Add a GIF"
                      style={{
                        padding: '0.6rem 0.9rem',
                        backgroundColor: showGiphy || gifButtonHover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                        color: 'white',
                        border: '1px solid ' + (showGiphy ? 'rgba(179,31,47,0.5)' : 'rgba(255,255,255,0.15)'),
                        borderRadius: '999px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                        transition: 'background-color 0.15s, border-color 0.15s'
                      }}
                    >
                      GIF
                    </button>
                    {showGiphy && (
                      <GiphyPicker
                        onSelect={(url) => { setSelectedGif(url); setShowGiphy(false) }}
                        onClose={() => setShowGiphy(false)}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!newComment.trim() && !selectedGif}
                    style={{
                      padding: '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none',
                      borderRadius: '999px', cursor: (newComment.trim() || selectedGif) ? 'pointer' : 'default', fontWeight: '700', fontSize: '0.85rem',
                      opacity: (newComment.trim() || selectedGif) ? 1 : 0.45, transition: 'opacity 0.15s'
                    }}
                  >
                    Post
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {comments.map(comment => (
                    <div key={comment._id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <Avatar
                        user={comment.commenter_id}
                        size={32}
                        ringColor="#1a1a1a"
                        onClick={comment.commenter_id?._id !== currentUserId ? () => goToUser(comment.commenter_id?._id) : undefined}
                      />
                      <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{ fontWeight: '700', fontSize: '0.85rem', color: 'white', cursor: comment.commenter_id?._id !== currentUserId ? 'pointer' : 'default' }}
                            onClick={() => comment.commenter_id?._id !== currentUserId && goToUser(comment.commenter_id?._id)}
                          >
                            {comment.commenter_id?.username || comment.commenter_id?.email}
                          </span>
                          <span style={{ color: '#555', fontSize: '0.72rem' }}>{formatDate(comment.createdAt)}</span>
                        </div>
                        {comment.comment && (
                          <p style={{ color: '#ddd', margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{comment.comment}</p>
                        )}
                        {comment.gif_url && (
                          <img
                            src={comment.gif_url}
                            alt="GIF"
                            style={{ maxHeight: '150px', borderRadius: '8px', display: 'block', marginTop: comment.comment ? '0.5rem' : 0 }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && <p style={{ color: '#555', fontSize: '0.85rem' }}>No comments yet — say something!</p>}
                </div>
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
