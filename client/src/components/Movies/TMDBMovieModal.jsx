import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Emoji from '../UI/Emoji'
import GiphyPicker from '../UI/GiphyPicker'
import Avatar from '../UI/Avatar'

function TMDBMovieModal({ movie, onClose, onLogMovie, hideLog, onWatchlistChange, onFavoriteChange }) {
  const navigate = useNavigate()
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistId, setWatchlistId] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlistHover, setWatchlistHover] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [favoriteHover, setFavoriteHover] = useState(false)
  const [trailerHover, setTrailerHover] = useState(false)
  const [whereHover, setWhereHover] = useState(false)
  const [communityHover, setCommunityHover] = useState(false)
  const [watchedMovieId, setWatchedMovieId] = useState(null)
  const [comments, setComments] = useState([])
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentFocused, setCommentFocused] = useState(false)
  const [showGiphy, setShowGiphy] = useState(false)
  const [selectedGif, setSelectedGif] = useState(null)
  const [gifButtonHover, setGifButtonHover] = useState(false)

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  const goToUser = (userId) => {
    navigate(`/user/${userId}`)
  }

  // "Comments" here are just this user's own log — the real comment section,
  // with every log from the community, lives in the feed. Send them there.
  const goToCommunityComments = () => {
    navigate('/feed', {
      state: {
        reopenMovie: {
          tmdb_id: movie.tmdb_id,
          title: tmdbMovie?.title || movie.title,
          year: tmdbMovie?.year || movie.year,
          poster_url: tmdbMovie?.poster_url || movie.poster_url
        }
      }
    })
  }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [tmdbRes, watchlistRes, favoriteRes, providersRes] = await Promise.all([
          api.get(`/movies/tmdb/${movie.tmdb_id}`),
          api.get(`/watchlist/check/${movie.tmdb_id}`),
          api.get(`/favorites/check/${movie.tmdb_id}`),
          api.get(`/movies/tmdb/${movie.tmdb_id}/providers`)
        ])
        setTmdbMovie(tmdbRes.data)
        setInWatchlist(watchlistRes.data.inWatchlist)
        setWatchlistId(watchlistRes.data.id)
        setIsFavorite(favoriteRes.data.isFavorite)
        setFavoriteId(favoriteRes.data.id)
        setProviders(providersRes.data.providers)

        // Comments live on your log for this movie, not on the movie itself —
        // if you haven't logged it yet there's simply nothing to fetch here.
        try {
          const logRes = await api.get(`/watched/movie/${movie.tmdb_id}`)
          setWatchedMovieId(logRes.data._id)
          const commentsRes = await api.get(`/comments/${logRes.data._id}`)
          setComments(commentsRes.data.comments)
          setHasMoreComments(commentsRes.data.hasMore)
        } catch (logErr) {
          // No log yet — the comment box will create one on first post.
        }
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && !selectedGif) return
    try {
      if (watchedMovieId) {
        const res = await api.post(`/comments/${watchedMovieId}`, { comment: newComment, gif_url: selectedGif })
        setComments([res.data, ...comments])
      } else {
        const res = await api.post(`/watched/comment/${movie.tmdb_id}`, {
          comment: newComment, gif_url: selectedGif,
          movie_title: tmdbMovie?.title, movie_poster: tmdbMovie?.poster_url, movie_year: tmdbMovie?.year
        })
        setWatchedMovieId(res.data.watchedMovieId)
        setComments([res.data.comment, ...comments])
      }
      setNewComment('')
      setSelectedGif(null)
    } catch (err) {
      console.error('Failed to add comment')
    }
  }

  const handleLoadMoreComments = async () => {
    if (comments.length === 0 || !watchedMovieId) return
    setLoadingMoreComments(true)
    try {
      const oldest = comments[comments.length - 1]
      const res = await api.get(`/comments/${watchedMovieId}`, { params: { before: oldest.createdAt, beforeId: oldest._id } })
      setComments(prev => [...prev, ...res.data.comments])
      setHasMoreComments(res.data.hasMore)
    } catch (err) {
      console.error('Failed to load more comments')
    } finally {
      setLoadingMoreComments(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`)
      if (res.data.deletedLog) {
        // That was the last comment on this unrated log — it just got deleted
        // server-side too, so revert to the "not logged yet" state.
        setWatchedMovieId(null)
        setComments([])
        setHasMoreComments(false)
        return
      }
      setComments(prev => prev.filter(c => c._id !== commentId))
    } catch (err) {
      console.error('Failed to delete comment')
    }
  }

  const handleWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${watchlistId}`)
        setInWatchlist(false)
        setWatchlistId(null)
      } else {
        const res = await api.post('/watchlist', {
          movie_id: String(movie.tmdb_id),
          movie_title: tmdbMovie.title,
          movie_poster: tmdbMovie.poster_url,
          movie_year: tmdbMovie.year
        })
        setInWatchlist(true)
        setWatchlistId(res.data._id)
      }
      onWatchlistChange && onWatchlistChange()
    } catch (err) {
      console.error('Watchlist error', err)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleFavorite = async () => {
    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${favoriteId}`)
        setIsFavorite(false)
        setFavoriteId(null)
      } else {
        const res = await api.post('/favorites', {
          movie_id: String(movie.tmdb_id),
          movie_title: tmdbMovie.title,
          movie_poster: tmdbMovie.poster_url,
          movie_year: tmdbMovie.year
        })
        setIsFavorite(true)
        setFavoriteId(res.data._id)
      }
      onFavoriteChange && onFavoriteChange()
    } catch (err) {
      console.error('Favorite error', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const imdbScore = tmdbMovie?.ratings?.imdb ? parseFloat(tmdbMovie.ratings.imdb) : null
  const rtScore = tmdbMovie?.ratings?.rotten_tomatoes ? parseInt(tmdbMovie.ratings.rotten_tomatoes, 10) : null
  const metaScore = tmdbMovie?.ratings?.metacritic ? parseInt(tmdbMovie.ratings.metacritic, 10) : null
  const metaColor = metaScore == null ? '#888' : metaScore >= 61 ? '#6c3' : metaScore >= 40 ? '#fc3' : '#f33'

  const metaLine = tmdbMovie
    ? [tmdbMovie.director, tmdbMovie.genres?.join(', '), tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : null, formatDate(tmdbMovie.release_date)]
        .filter(Boolean)
    : []

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', borderRadius: '12px',
        width: '100%', maxWidth: '980px',
        maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {loading && <p style={{ color: 'white', padding: '2rem' }}>Loading...</p>}
        {error && <p style={{ color: '#b31f2f', padding: '2rem' }}>{error}</p>}

        {tmdbMovie && (
          <>
            {/* Backdrop */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
              {tmdbMovie.backdrop_url && (
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
              {tmdbMovie.poster_url && (
                <img
                  src={tmdbMovie.poster_url}
                  alt={tmdbMovie.title}
                  style={{ width: '160px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}
                />
              )}
              <div style={{ flex: 1, paddingTop: '132px', minWidth: 0 }}>
                <h2 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: '800' }}>
                  {tmdbMovie.title} <span style={{ color: '#aaa', fontWeight: '400' }}>({tmdbMovie.year})</span>
                </h2>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                  {metaLine.join('  ·  ')}
                </p>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
              {/* Ratings */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <a
                  href={tmdbMovie.imdb_id ? `https://www.imdb.com/title/${tmdbMovie.imdb_id}` : undefined}
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
                    {metaScore != null ? metaScore : '–'}
                  </span>
                  Metacritic
                </a>
              </div>

              {/* Synopsis */}
              {tmdbMovie.description && (
                <p style={{ color: 'white', margin: '0 0 1.5rem 0', fontSize: '0.9rem', lineHeight: '1.6' }}>
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!hideLog && (
                  <button
                    onClick={() => onLogMovie(movie)}
                    style={{ padding: '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Log Movie
                  </button>
                )}
                <button
                  onClick={handleWatchlist}
                  disabled={watchlistLoading}
                  onMouseEnter={() => setWatchlistHover(true)}
                  onMouseLeave={() => setWatchlistHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    backgroundColor: inWatchlist
                      ? (watchlistHover ? 'rgba(179,31,47,0.15)' : 'rgba(0,200,0,0.15)')
                      : 'rgba(255,255,255,0.08)',
                    color: inWatchlist ? (watchlistHover ? '#b31f2f' : '#00c800') : 'white',
                    border: '1px solid ' + (inWatchlist ? (watchlistHover ? '#b31f2f' : '#00c800') : 'rgba(255,255,255,0.2)'),
                    borderRadius: '4px', cursor: watchlistLoading ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.85rem',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s'
                  }}
                >
                  {watchlistLoading
                    ? '...'
                    : inWatchlist
                      ? <Emoji>{watchlistHover ? '🗑 Remove' : '✓ In Watchlist'}</Emoji>
                      : '+ Watchlist'}
                </button>
                <button
                  onClick={handleFavorite}
                  disabled={favoriteLoading}
                  onMouseEnter={() => setFavoriteHover(true)}
                  onMouseLeave={() => setFavoriteHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    backgroundColor: isFavorite
                      ? (favoriteHover ? 'rgba(179,31,47,0.15)' : 'rgba(220,60,79,0.15)')
                      : 'rgba(255,255,255,0.08)',
                    color: isFavorite ? (favoriteHover ? '#b31f2f' : '#dc3c4f') : 'white',
                    border: '1px solid ' + (isFavorite ? (favoriteHover ? '#b31f2f' : '#dc3c4f') : 'rgba(255,255,255,0.2)'),
                    borderRadius: '4px', cursor: favoriteLoading ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.85rem',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s'
                  }}
                >
                  {favoriteLoading
                    ? '...'
                    : isFavorite
                      ? <Emoji>{favoriteHover ? '💔 Remove' : '❤️ Favorited'}</Emoji>
                      : <Emoji>🤍 Favorite</Emoji>}
                </button>
                {tmdbMovie.trailer_key && (
                  <a
                    href={'https://www.youtube.com/watch?v=' + tmdbMovie.trailer_key}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setTrailerHover(true)}
                    onMouseLeave={() => setTrailerHover(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 1.25rem 0.6rem 1rem',
                      backgroundColor: trailerHover ? '#b31f2f' : 'rgba(179,31,47,0.12)',
                      border: '1px solid ' + (trailerHover ? '#b31f2f' : 'rgba(179,31,47,0.5)'),
                      borderRadius: '6px', color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem',
                      boxShadow: trailerHover ? '0 4px 14px rgba(179,31,47,0.4)' : 'none',
                      transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: trailerHover ? 'white' : '#b31f2f',
                      color: trailerHover ? '#b31f2f' : 'white',
                      fontSize: '0.6rem', flexShrink: 0
                    }}>
                      ▶
                    </span>
                    Watch Trailer
                  </a>
                )}

                {/* Where to Watch — one click, straight through. Uses the JustWatch/TMDB
                    link when we have regional availability data, otherwise falls back to
                    a Google search — but either way it's a single <a>, not a button that
                    opens something else you then have to click again. */}
                <a
                  href={
                    providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length)
                      ? providers.link
                      : 'https://www.google.com/search?q=where+to+watch+' + encodeURIComponent(tmdbMovie.title)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setWhereHover(true)}
                  onMouseLeave={() => setWhereHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 1.25rem 0.6rem 1rem',
                    backgroundColor: whereHover ? '#b31f2f' : 'rgba(179,31,47,0.12)',
                    border: '1px solid ' + (whereHover ? '#b31f2f' : 'rgba(179,31,47,0.5)'),
                    borderRadius: '6px', color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem',
                    boxShadow: whereHover ? '0 4px 14px rgba(179,31,47,0.4)' : 'none',
                    transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: whereHover ? 'white' : '#b31f2f',
                    fontSize: '0.65rem', flexShrink: 0, transition: 'background-color 0.15s'
                  }}>
                    📺
                  </span>
                  Where to Watch
                </a>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', margin: watchedMovieId ? '0 0 1rem 0' : '0 0 0.3rem 0' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 800 }}><Emoji>💬</Emoji> Comments ({comments.length})</h3>
                <button
                  onClick={goToCommunityComments}
                  onMouseEnter={() => setCommunityHover(true)}
                  onMouseLeave={() => setCommunityHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                    padding: '0.4rem 0.9rem 0.4rem 0.4rem',
                    backgroundColor: communityHover ? '#b31f2f' : 'rgba(179,31,47,0.12)',
                    border: '1px solid ' + (communityHover ? '#b31f2f' : 'rgba(179,31,47,0.5)'),
                    borderRadius: '999px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem',
                    boxShadow: communityHover ? '0 4px 14px rgba(179,31,47,0.4)' : 'none',
                    transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: communityHover ? 'white' : '#b31f2f',
                    fontSize: '0.65rem', flexShrink: 0, transition: 'background-color 0.15s'
                  }}>
                    🌍
                  </span>
                  Community Comments
                </button>
              </div>
              {!watchedMovieId && (
                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>Commenting logs this movie for you — you can rate it later from your profile.</p>
              )}

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
                        {comment.commenter_id?._id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            aria-label="Delete comment"
                            title="Delete comment"
                            style={{
                              marginLeft: 'auto', background: 'none', border: 'none', color: '#666',
                              fontSize: '0.85rem', cursor: 'pointer', padding: '0.15rem 0.3rem', lineHeight: 1,
                              transition: 'color 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#dc3c4f' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
                          >
                            🗑️
                          </button>
                        )}
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
                {hasMoreComments && (
                  <button
                    onClick={handleLoadMoreComments}
                    disabled={loadingMoreComments}
                    style={{
                      background: 'none', border: 'none', color: '#999', fontSize: '0.82rem', fontWeight: 600,
                      cursor: loadingMoreComments ? 'default' : 'pointer', padding: '0.3rem 0', textAlign: 'center'
                    }}
                  >
                    {loadingMoreComments ? 'Loading…' : 'Load more comments'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TMDBMovieModal
