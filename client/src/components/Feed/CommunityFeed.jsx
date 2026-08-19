import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
import Avatar from '../UI/Avatar'

function CommunityFeed() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [newComments, setNewComments] = useState({})
  const [inputFocused, setInputFocused] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/movies/search?q=${query}`)
        setSearchResults(res.data)
      } catch (err) {
        console.error('Search failed')
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  const fetchWatchedForMovie = async (tmdbId) => {
    const res = await api.get(`/watched/all/movie/${tmdbId}`)
    setWatchedMovies(res.data)
  }

  const goToUser = (userId) => {
    navigate(`/user/${userId}`, { state: { backTo: '/feed', reopenMovie: selectedMovie } })
  }

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie)
    setQuery('')
    setSearchResults([])
    setLoading(true)
    try {
      await fetchWatchedForMovie(movie.tmdb_id)
    } catch (err) {
      console.error('Failed to load watched movies')
    } finally {
      setLoading(false)
    }
  }

  // Arriving back from a user's profile (e.g. clicked a commenter's name/photo) —
  // reopen the movie's comment thread we came from instead of landing on a blank feed.
  useEffect(() => {
    if (location.state?.reopenMovie) {
      handleSelectMovie(location.state.reopenMovie)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for new ratings/logs (from any user, including yourself) while a movie is open
  useEffect(() => {
    if (!selectedMovie) return
    const interval = setInterval(() => {
      fetchWatchedForMovie(selectedMovie.tmdb_id).catch(() => {
        console.error('Failed to refresh watched movies')
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedMovie])

  const handleAddComment = async (watchedMovieId) => {
    const comment = newComments[watchedMovieId]
    if (!comment?.trim()) return
    try {
      const res = await api.post(`/comments/${watchedMovieId}`, { comment })
      setWatchedMovies(prev => prev.map(w => {
        if (w._id === watchedMovieId) {
          return { ...w, comments: [res.data, ...w.comments] }
        }
        return w
      }))
      setNewComments(prev => ({ ...prev, [watchedMovieId]: '' }))
    } catch (err) {
      console.error('Failed to add comment')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const StarRating = ({ rating, size = 13 }) => (
    <span style={{ display: 'inline-flex', gap: '1px', verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#dc3c4f' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </span>
  )

  const avgRating = watchedMovies.length
    ? watchedMovies.reduce((sum, w) => sum + w.rating, 0) / watchedMovies.length
    : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <NavButton onClick={() => navigate('/profile')} icon="👤">
          My Profile
        </NavButton>
      </Navbar>

      <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>

        {/* Intro */}
        {!selectedMovie && (
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              🌍 Community Feed
            </h2>
            <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>
              Pick a movie and see what everyone's saying about it.
            </p>
          </div>
        )}

        {/* Search Box */}
        {!selectedMovie && (
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(179,31,47,0.08) 0%, rgba(255,255,255,0.03) 60%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px',
            padding: '1.5rem', marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: inputFocused ? '#dc3c4f' : '#666', fontSize: '1rem', transition: 'color 0.2s' }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Search for a movie..."
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem', borderRadius: '12px',
                  border: '1px solid ' + (inputFocused ? '#b31f2f' : 'rgba(255,255,255,0.1)'),
                  backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
                  boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none',
                  boxShadow: inputFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>

            {searching && (
              <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center', margin: '1rem 0 0 0' }}>Searching...</p>
            )}

            {!searching && query.trim() && searchResults.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0 0 0' }}>No movies found for "{query}"</p>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                {searchResults.map(movie => (
                  <div
                    key={movie.tmdb_id}
                    onClick={() => handleSelectMovie(movie)}
                    style={{ textAlign: 'center', cursor: 'pointer', borderRadius: '10px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '180px', backgroundColor: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#aaa' }}>No Poster</span>
                      </div>
                    )}
                    <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.15rem', fontWeight: 600 }}>{movie.title}</p>
                    <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>{movie.year}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Movie Hero */}
        {selectedMovie && (
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(179,31,47,0.1) 0%, rgba(255,255,255,0.03) 55%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px',
            padding: '1.5rem', marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(179,31,47,0.25) 0%, transparent 70%)', pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <button
                onClick={() => { setSelectedMovie(null); setWatchedMovies([]) }}
                aria-label="Back to search"
                title="Back to search"
                style={{
                  position: 'absolute', top: '-0.75rem', right: '-0.75rem',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#aaa', width: '30px', height: '30px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#aaa' }}
              >
                ✕
              </button>

              {selectedMovie.poster_url && (
                <img src={selectedMovie.poster_url} alt={selectedMovie.title} style={{ width: '72px', borderRadius: '10px', boxShadow: '0 6px 18px rgba(0,0,0,0.5)', flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.3rem', fontWeight: 800 }}>{selectedMovie.title} <span style={{ color: '#888', fontWeight: 500 }}>({selectedMovie.year})</span></h3>
                <p style={{ color: '#999', margin: 0, fontSize: '0.85rem' }}>💬 {watchedMovies.length} {watchedMovies.length === 1 ? 'log' : 'logs'} from the community</p>
              </div>

              {watchedMovies.length > 0 && (
                <div style={{
                  textAlign: 'center', padding: '0.65rem 1.1rem',
                  backgroundColor: 'rgba(179,31,47,0.12)', border: '1px solid rgba(179,31,47,0.35)',
                  borderRadius: '14px', flexShrink: 0
                }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#dc3c4f', lineHeight: 1 }}>{avgRating.toFixed(1)}</p>
                  <div style={{ margin: '0.3rem 0 0.15rem 0' }}><StarRating rating={avgRating} size={11} /></div>
                  <p style={{ color: '#888', fontSize: '0.65rem', margin: 0, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>avg rating</p>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', animation: 'pulse 1.4s ease-in-out infinite' }}>🎬</p>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Loading community logs...</p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
          </div>
        )}

        {/* Watched Movies with Comments */}
        {!loading && selectedMovie && watchedMovies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍿</p>
            <p style={{ color: '#999', margin: 0 }}>Nobody has logged this movie yet. Be the first!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {watchedMovies.map(watched => {
            const isOwn = watched.user_id?._id === currentUserId
            return (
              <div
                key={watched._id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >

                {/* User Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Avatar
                    user={watched.user_id}
                    size={44}
                    onClick={!isOwn ? () => goToUser(watched.user_id?._id) : undefined}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem', cursor: isOwn ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => !isOwn && goToUser(watched.user_id?._id)}
                    >
                      {watched.user_id?.username || watched.user_id?.email}
                      {isOwn && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#dc3c4f', backgroundColor: 'rgba(179,31,47,0.15)', border: '1px solid rgba(179,31,47,0.35)', borderRadius: '999px', padding: '0.1rem 0.5rem', letterSpacing: '0.03em' }}>YOU</span>
                      )}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <StarRating rating={watched.rating} /> <span style={{ color: '#555' }}>· {formatDate(watched.watchedAt)}</span>
                    </p>
                  </div>
                </div>

                {/* Comments */}
                <div style={{ padding: '1.1rem 1.5rem' }}>
                  {watched.comments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.1rem' }}>
                      {watched.comments.map(comment => (
                        <div key={comment._id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                          <Avatar
                            user={comment.commenter_id}
                            size={30}
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
                            <p style={{ color: '#ddd', margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1.1rem' }}>No comments yet — say something!</p>
                  )}

                  {/* Comment Input */}
                  {!isOwn && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={newComments[watched._id] || ''}
                        onChange={(e) => setNewComments(prev => ({ ...prev, [watched._id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(watched._id)}
                        placeholder="Add a comment..."
                        maxLength={500}
                        style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                        onFocus={e => { e.target.style.borderColor = '#b31f2f'; e.target.style.boxShadow = '0 0 0 3px rgba(179,31,47,0.18)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                      />
                      <button
                        onClick={() => handleAddComment(watched._id)}
                        disabled={!newComments[watched._id]?.trim()}
                        style={{
                          padding: '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none',
                          borderRadius: '999px', cursor: newComments[watched._id]?.trim() ? 'pointer' : 'default',
                          fontWeight: '700', fontSize: '0.85rem',
                          opacity: newComments[watched._id]?.trim() ? 1 : 0.45,
                          transition: 'opacity 0.15s, background-color 0.15s'
                        }}
                      >
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default CommunityFeed
