import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function CommunityFeed() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [newComments, setNewComments] = useState({})
  const navigate = useNavigate()

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/movies/search?q=${query}`)
        setSearchResults(res.data)
      } catch (err) {
        console.error('Search failed')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  const fetchWatchedForMovie = async (tmdbId) => {
    const res = await api.get(`/watched/all/movie/${tmdbId}`)
    setWatchedMovies(res.data)
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

  const Avatar = ({ user, size = 40, onClick }) => (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      {user?.profile_photo ? (
        <img src={user.profile_photo} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.35 }}>
          {(user?.username || user?.email || '?')[0].toUpperCase()}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      {/* Navbar */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(229,9,20,0.3)',
        padding: '0 2rem', height: '64px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Cine<span style={{ color: '#e50914' }}>Log</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          👤 My Profile
        </button>
      </div>

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* Search Box */}
        {!selectedMovie && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '1rem' }}>
              Select a movie to see community reviews!
            </p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search for a movie..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
            />
            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {searchResults.map(movie => (
                  <div key={movie.tmdb_id} onClick={() => handleSelectMovie(movie)} style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '180px', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#aaa' }}>No Poster</span>
                      </div>
                    )}
                    <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.5rem' }}>{movie.title}</p>
                    <p style={{ color: '#aaa', fontSize: '0.75rem' }}>{movie.year}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Movie Header */}
        {selectedMovie && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            {selectedMovie.poster_url && (
              <img src={selectedMovie.poster_url} alt={selectedMovie.title} style={{ width: '60px', borderRadius: '8px' }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedMovie.title} ({selectedMovie.year})</h3>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>{watchedMovies.length} logs from the community</p>
            </div>
            {watchedMovies.length > 0 && (
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px' }}>
                <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#e50914' }}>
                  ⭐ {(watchedMovies.reduce((sum, w) => sum + w.rating, 0) / watchedMovies.length).toFixed(1)}
                </p>
                <p style={{ color: '#aaa', fontSize: '0.7rem', margin: 0, whiteSpace: 'nowrap' }}>avg rating</p>
              </div>
            )}
            <button onClick={() => { setSelectedMovie(null); setWatchedMovies([]) }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
          </div>
        )}

        {loading && <p style={{ textAlign: 'center', color: '#aaa' }}>Loading...</p>}

        {/* Watched Movies with Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {watchedMovies.map(watched => (
            <div key={watched._id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>

              {/* User Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Avatar
                  user={watched.user_id}
                  size={44}
                  onClick={() => watched.user_id?._id !== currentUserId && navigate(`/user/${watched.user_id?._id}`)}
                />
                <div>
                  <p
                    style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem', cursor: watched.user_id?._id !== currentUserId ? 'pointer' : 'default' }}
                    onClick={() => watched.user_id?._id !== currentUserId && navigate(`/user/${watched.user_id?._id}`)}
                  >
                    {watched.user_id?.username || watched.user_id?.email}
                  </p>
                  <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
                    ⭐ {watched.rating}/5 · {formatDate(watched.watchedAt)}
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div style={{ padding: '1rem 1.5rem' }}>
                {watched.comments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {watched.comments.map(comment => (
                      <div key={comment._id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Avatar
                          user={comment.commenter_id}
                          size={32}
                          onClick={() => comment.commenter_id?._id !== currentUserId && navigate(`/user/${comment.commenter_id?._id}`)}
                        />
                        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white', cursor: comment.commenter_id?._id !== currentUserId ? 'pointer' : 'default' }}
                              onClick={() => comment.commenter_id?._id !== currentUserId && navigate(`/user/${comment.commenter_id?._id}`)}
                            >
                              {comment.commenter_id?.username || comment.commenter_id?.email}
                            </span>
                            <span style={{ color: '#555', fontSize: '0.75rem' }}>· {formatDate(comment.createdAt)}</span>
                          </div>
                          <p style={{ color: '#ddd', margin: 0, fontSize: '0.9rem' }}>{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>No comments yet!</p>
                )}

                {/* Comment Input */}
                {watched.user_id?._id !== currentUserId && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={newComments[watched._id] || ''}
                      onChange={(e) => setNewComments(prev => ({ ...prev, [watched._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(watched._id)}
                      placeholder="Add a comment..."
                      maxLength={500}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <button
                      onClick={() => handleAddComment(watched._id)}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommunityFeed