import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function CommunityFeed() {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [newComments, setNewComments] = useState({})
  const navigate = useNavigate()

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
    setShowSearch(false)
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
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Community Feed</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowSearch(!showSearch)}>🎬 Select Movie</button>
          <button onClick={() => navigate('/profile')}>My Profile</button>
        </div>
      </div>

      {showSearch && (
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            autoFocus
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', boxSizing: 'border-box', marginBottom: '1rem' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
            {searchResults.map(movie => (
              <div key={movie.tmdb_id} onClick={() => handleSelectMovie(movie)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '100%', height: '180px', backgroundColor: '#2a2a2a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white' }}>No Poster</span>
                  </div>
                )}
                <p style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.5rem' }}>{movie.title}</p>
                <p style={{ color: '#aaa', fontSize: '0.75rem' }}>{movie.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMovie && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
          {selectedMovie.poster_url && (
            <img src={selectedMovie.poster_url} alt={selectedMovie.title} style={{ width: '60px', borderRadius: '4px' }} />
          )}
          <div>
            <h3 style={{ margin: 0 }}>{selectedMovie.title} ({selectedMovie.year})</h3>
            <p style={{ color: '#aaa', margin: 0 }}>{watchedMovies.length} logs</p>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}

      {!selectedMovie && !showSearch && (
        <p style={{ color: '#aaa', textAlign: 'center' }}>Select a movie to see community reviews!</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {watchedMovies.map(watched => (
          <div key={watched._id} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0' }}>⭐ {watched.rating}/5</p>
                <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>
                  by <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>{watched.user_id?.email}</span> · {formatDate(watched.watchedAt)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {watched.comments.map(comment => (
                <div key={comment._id} style={{ padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                  <p style={{ color: 'white', margin: '0 0 0.25rem 0' }}>{comment.comment}</p>
                  <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>
                    {comment.commenter_id?.email} · {formatDate(comment.createdAt)}
                  </p>
                </div>
              ))}
              {watched.comments.length === 0 && <p style={{ color: '#aaa', fontSize: '0.8rem' }}>No comments yet!</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newComments[watched._id] || ''}
                onChange={(e) => setNewComments(prev => ({ ...prev, [watched._id]: e.target.value }))}
                placeholder="Add a comment..."
                maxLength={500}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
              />
              <button
                onClick={() => handleAddComment(watched._id)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Post
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommunityFeed