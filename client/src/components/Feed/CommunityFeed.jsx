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

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie)
    setQuery('')
    setSearchResults([])
    setLoading(true)
    try {
      const res = await api.get(`/watched/all/movie/${movie.tmdb_id}`)
      setWatchedMovies(res.data)
    } catch (err) {
      console.error('Failed to load watched movies')
    } finally {
      setLoading(false)
    }
  }

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
        <button
          onClick={() => navigate('/profile')}
          style={{
            padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', cursor: 'pointer'
          }}
        >
          👤 My Profile
        </button>
      </div>

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* Search Box - always visible when no movie selected */}
        {!selectedMovie && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '1rem', fontSize: '1rem' }}>
              Select a movie to see community reviews!
            </p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search for a movie..."
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white', boxSizing: 'border-box', fontSize: '1rem', outline: 'none'
              }}
            />
            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {searchResults.map(movie => (
                  <div
                    key={movie.tmdb_id}
                    onClick={() => handleSelectMovie(movie)}
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
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

        {/* Selected Movie */}
        {selectedMovie && (
          <div style={{
            display: 'flex', gap: '1rem', alignItems: 'center',
            marginBottom: '1.5rem', padding: '1rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px'
          }}>
            {selectedMovie.poster_url && (
              <img src={selectedMovie.poster_url} alt={selectedMovie.title} style={{ width: '60px', borderRadius: '8px' }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedMovie.title} ({selectedMovie.year})</h3>
              <p style={{ color: '#aaa', margin: 0 }}>{watchedMovies.length} logs from the community</p>
            </div>
            <button
              onClick={() => { setSelectedMovie(null); setWatchedMovies([]) }}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {loading && <p style={{ textAlign: 'center', color: '#aaa' }}>Loading...</p>}

        {/* Watched Movies with Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {watchedMovies.map(watched => (
            <div key={watched._id} style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: '#e50914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', flexShrink: 0
                }}>
                  {watched.user_id?.email[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{watched.user_id?.email}</p>
                  <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
                    ⭐ {watched.rating}/5 · {formatDate(watched.watchedAt)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {watched.comments.map(comment => (
                  <div key={comment._id} style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: 'white', margin: '0 0 0.25rem 0' }}>{comment.comment}</p>
                    <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>
                      {comment.commenter_id?.email} · {formatDate(comment.createdAt)}
                    </p>
                  </div>
                ))}
                {watched.comments.length === 0 && (
                  <p style={{ color: '#aaa', fontSize: '0.8rem' }}>No comments yet!</p>
                )}
              </div>

              {watched.user_id?._id !== currentUserId && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newComments[watched._id] || ''}
                    onChange={(e) => setNewComments(prev => ({ ...prev, [watched._id]: e.target.value }))}
                    placeholder="Add a comment..."
                    maxLength={500}
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white', outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(watched._id)}
                    style={{
                      padding: '0.5rem 1rem', backgroundColor: '#e50914',
                      color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommunityFeed