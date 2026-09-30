import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import useModalTransition, { modalTransitionKeyframes } from '../../hooks/useModalTransition'
import { fetchMovie, getCachedMovie } from '../../api/movieCache'
import { prefetchPerson } from '../../api/personCache'
import ConfirmModal from '../UI/ConfirmModal'
import Emoji from '../UI/Emoji'
import GiphyPicker from '../UI/GiphyPicker'
import Avatar from '../UI/Avatar'
import CommunityRating from '../UI/CommunityRating'
import MovieDetailsSkeleton from '../UI/MovieDetailsSkeleton'
import TrailerModal from '../UI/TrailerModal'
import WatchProviderLogos from '../UI/WatchProviderLogos'
import FadeInImage from '../UI/FadeInImage'
import { DirectorLink, MovieFacts } from '../UI/MovieMeta'
import { buildNavState } from '../../utils/navState'

const RATING_LABELS = { 1: 'Not for me', 2: 'It was okay', 3: 'Liked it', 4: 'Really liked it', 5: 'Loved it!' }

const StarRating = ({ rating, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: '1px', verticalAlign: 'middle' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#dc3c4f' : 'rgba(255,255,255,0.15)' }}>★</span>
    ))}
  </span>
)

function MovieDetailModal({ watchedMovieId, onClose, onDeleted, onRatingUpdated, initialMovie }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [watchedMovie, setWatchedMovie] = useState(null)
  const [tmdbMovie, setTmdbMovie] = useState(() => initialMovie?.movie_id ? getCachedMovie(initialMovie.movie_id) : null)
  const [providers, setProviders] = useState(null)
  const [comments, setComments] = useState([])
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentFocused, setCommentFocused] = useState(false)
  const [showGiphy, setShowGiphy] = useState(false)
  const [selectedGif, setSelectedGif] = useState(null)
  const [gifButtonHover, setGifButtonHover] = useState(false)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingUpdated, setRatingUpdated] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [closeHover, setCloseHover] = useState(false)
  const [communityHover, setCommunityHover] = useState(false)
  const [trailerHover, setTrailerHover] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  // Same reasoning as TMDBMovieModal: the poster/backdrop overlap below is
  // tuned in pixels for a desktop-width backdrop, and needs to shrink in
  // step with a narrower, shorter poster on mobile.
  const isMobile = useIsMobile()
  // Grows out of the clicked poster on open, shrinks back into it on close.
  const { panelRef, overlayStyle, panelStyle, close } = useModalTransition(onClose)

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  const goToUser = (userId) => {
    navigate(`/user/${userId}`, { state: buildNavState(location, { reopenWatchedMovie: watchedMovieId }) })
  }

  const goToPerson = (person) => {
    navigate(`/person/${person.id}?role=${person.role}`, {
      state: buildNavState(location, {
        initialPerson: { id: person.id, name: person.name, profile_url: person.profile_url },
        reopenWatchedMovie: watchedMovieId
      })
    })
  }

  // "Comments" here are just this log's own thread — the real comment section,
  // with every log from the community, lives in the feed. Send them there.
  // `returnReopenWatchedMovie` isn't touched by the feed itself — it's
  // carried through so the feed's own "Back" button can hand it to
  // `backTo` (this page) and reopen this exact log's modal, the same
  // "go back and reopen" contract goToPerson/goToUser use.
  const goToCommunityComments = () => {
    navigate('/feed', {
      state: buildNavState(location, {
        reopenMovie: {
          tmdb_id: watchedMovie.movie_id,
          title: tmdbMovie?.title || watchedMovie.movie_title,
          year: tmdbMovie?.year || watchedMovie.movie_year,
          poster_url: tmdbMovie?.poster_url || watchedMovie.movie_poster
        },
        returnReopenWatchedMovie: watchedMovieId
      })
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // If the caller already knows the TMDB id (e.g. from a poster grid
      // that has the full watched-movie record in hand), start these in
      // parallel with the watched-log fetch instead of waiting on it.
      const knownTmdbId = initialMovie?.movie_id
      const tmdbPromise = knownTmdbId ? fetchMovie(knownTmdbId) : null
      const providersPromise = knownTmdbId
        ? api.get(`/movies/tmdb/${knownTmdbId}/providers?title=${encodeURIComponent(initialMovie.movie_title || '')}`)
        : null

      const [watchedRes, commentsRes] = await Promise.all([
        api.get(`/watched/id/${watchedMovieId}`),
        api.get(`/comments/${watchedMovieId}`)
      ])
      setWatchedMovie(watchedRes.data)
      setRating(watchedRes.data.rating)
      setComments(commentsRes.data.comments)
      setHasMoreComments(commentsRes.data.hasMore)

      const tmdbId = knownTmdbId || watchedRes.data.movie_id
      const [tmdbData, providersRes] = await Promise.all([
        tmdbPromise || fetchMovie(tmdbId),
        providersPromise || api.get(`/movies/tmdb/${tmdbId}/providers?title=${encodeURIComponent(watchedRes.data.movie_title || '')}`)
      ])
      setTmdbMovie(tmdbData)
      setProviders(providersRes.data.providers)
    } catch (err) {
      setError('Failed to load movie details')
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
      close()
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

  const handleLoadMoreComments = async () => {
    if (comments.length === 0) return
    setLoadingMoreComments(true)
    try {
      const oldest = comments[comments.length - 1]
      const res = await api.get(`/comments/${watchedMovieId}`, { params: { before: oldest.createdAt, beforeId: oldest._id } })
      setComments(prev => [...prev, ...res.data.comments])
      setHasMoreComments(res.data.hasMore)
    } catch (err) {
      setError('Failed to load more comments')
    } finally {
      setLoadingMoreComments(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`)
      if (res.data.deletedLog) {
        // That was the last comment on this unrated log — the log itself
        // just got deleted server-side too, so there's nothing left to show.
        onDeleted && onDeleted()
        close()
        return
      }
      setComments(prev => prev.filter(c => c._id !== commentId))
    } catch (err) {
      setError('Failed to delete comment')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const isOwner = watchedMovie?.user_id === currentUserId || watchedMovie?.user_id?._id === currentUserId
  const displayRating = hoverRating || rating || 0

  // Renders the header immediately from whatever the caller already knew
  // (poster grid item) before the real fetch resolves, same as TMDBMovieModal.
  const display = watchedMovie || initialMovie || {}

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000, padding: '1rem',
        ...overlayStyle
      }}>
        <style>{`
          ${modalTransitionKeyframes}
          @keyframes movieContentFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div ref={panelRef} style={{
          backgroundColor: '#1a1a1a', borderRadius: '16px',
          width: '100%', maxWidth: '980px',
          maxHeight: '90dvh', overflowY: 'auto', overflowX: 'hidden',
          position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          ...panelStyle
        }}>
          <button
            onClick={close}
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

          {error && <p style={{ color: '#dc3c4f', padding: '2rem' }}>{error}</p>}

          {/* Header renders immediately from initialMovie/watchedMovie
              (whichever is available) rather than waiting on the full
              fetch — everything below fills in smoothly as it resolves. */}
          {!error && (
            <>
              {/* Backdrop */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                {tmdbMovie?.backdrop_url && (
                  <FadeInImage
                    src={tmdbMovie.backdrop_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.75) 65%, #1a1a1a 100%)'
                }} />
                {tmdbMovie?.trailer_key && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    onMouseEnter={() => setTrailerHover(true)}
                    onMouseLeave={() => setTrailerHover(false)}
                    aria-label="Play trailer"
                    style={{
                      position: 'absolute', top: '50%', left: '50%', transform: trailerHover ? 'translate(-50%, -50%) scale(1.08)' : 'translate(-50%, -50%) scale(1)',
                      width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: '50%',
                      backgroundColor: trailerHover ? '#b31f2f' : 'rgba(0,0,0,0.55)',
                      border: '2px solid ' + (trailerHover ? '#b31f2f' : 'rgba(255,255,255,0.6)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: trailerHover ? '0 8px 26px rgba(179,31,47,0.55)' : '0 4px 18px rgba(0,0,0,0.5)',
                      transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <span style={{
                      display: 'block', width: 0, height: 0, marginLeft: '5px',
                      borderTop: '13px solid transparent', borderBottom: '13px solid transparent',
                      borderLeft: '21px solid white'
                    }} />
                  </button>
                )}
              </div>

              {/* Poster + title, overlapping the backdrop. Overlap and
                  paddingTop are tuned together to the poster's height, so
                  both scale down on mobile — see TMDBMovieModal for why. */}
              <div style={{
                display: 'flex', gap: isMobile ? '1rem' : '1.5rem',
                padding: isMobile ? '0 1rem' : '0 2rem',
                marginTop: isMobile ? '-80px' : '-130px',
                position: 'relative', zIndex: 2
              }}>
                {display.movie_poster && (
                  <img
                    src={display.movie_poster}
                    alt={display.movie_title}
                    style={{ width: isMobile ? '100px' : '160px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}
                  />
                )}
                <div style={{ flex: 1, paddingTop: isMobile ? '82px' : '132px', minWidth: 0 }}>
                  <h2 style={{ color: 'white', margin: '0 0 0.3rem 0', fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>
                    {display.movie_title} <span style={{ color: '#aaa', fontWeight: '400' }}>({display.movie_year})</span>
                  </h2>
                  <DirectorLink
                    director={tmdbMovie?.director}
                    onClick={goToPerson}
                    onHover={(d) => prefetchPerson(d.id, d.role)}
                    isMobile={isMobile}
                  />
                  {/* Desktop: runtime, date and genres sit under the title. On a
                      phone this column is only ~190px wide (it shares the row with
                      the poster), so they go in a full-width row below instead. */}
                  {!isMobile && tmdbMovie && (
                    <MovieFacts genres={tmdbMovie.genres} runtime={tmdbMovie.runtime} releaseDate={tmdbMovie.release_date} style={{ marginTop: '0.7rem' }} />
                  )}
                </div>
              </div>

              {isMobile && tmdbMovie && (
                <MovieFacts
                  genres={tmdbMovie.genres} runtime={tmdbMovie.runtime} releaseDate={tmdbMovie.release_date}
                  isMobile
                  style={{ padding: '0.9rem 1rem 0', animation: 'movieContentFadeIn 0.35s ease' }}
                />
              )}

              <div style={{ padding: isMobile ? '1.25rem 1rem 1.5rem 1rem' : '1.5rem 2rem 2rem 2rem' }}>
                {!tmdbMovie ? <MovieDetailsSkeleton /> : (
                  <div style={{ animation: 'movieContentFadeIn 0.35s ease' }}>
                    {/* Ratings */}
                    <CommunityRating average={tmdbMovie.communityRating?.average} count={tmdbMovie.communityRating?.count || 0} />

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
                          {tmdbMovie.cast.map((member, i) => {
                            const clickable = Boolean(member.id)
                            return (
                              <div
                                key={i}
                                onClick={() => clickable && goToPerson(member)}
                                style={{ flexShrink: 0, width: '76px', textAlign: 'center', cursor: clickable ? 'pointer' : 'default' }}
                              >
                                {member.profile_url ? (
                                  <img
                                    src={member.profile_url}
                                    alt={member.name}
                                    style={{
                                      width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.4rem',
                                      border: '2px solid transparent', transition: 'transform 0.15s, border-color 0.15s'
                                    }}
                                    onMouseEnter={e => { if (clickable) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = '#dc3c4f'; prefetchPerson(member.id, member.role) } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent' }}
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
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                      <WatchProviderLogos providers={providers} title={tmdbMovie.title || display.movie_title} releaseDate={tmdbMovie.release_date} />
                    </div>
                  </div>
                )}

                {!watchedMovie ? <MovieDetailsSkeleton /> : (
                <div style={{ animation: 'movieContentFadeIn 0.35s ease' }}>
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
                  ) : watchedMovie.rating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <StarRating rating={watchedMovie.rating} size={20} />
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{watchedMovie.rating}/5</span>
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>Not rated yet</p>
                  )}
                  <p style={{ color: '#888', fontSize: '0.78rem', margin: '0.85rem 0 0 0' }}>Watched {formatDate(watchedMovie.watchedAt)}</p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', margin: '0 0 1rem 0' }}>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap' }}><Emoji>💬</Emoji> Comments ({comments.length})</h3>
                  <button
                    onClick={goToCommunityComments}
                    onMouseEnter={() => setCommunityHover(true)}
                    onMouseLeave={() => setCommunityHover(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                      padding: '0.4rem 0.9rem 0.4rem 0.4rem',
                      backgroundColor: communityHover ? '#b31f2f' : 'rgba(179,31,47,0.12)',
                      border: '1px solid ' + (communityHover ? '#b31f2f' : 'rgba(179,31,47,0.5)'),
                      borderRadius: '999px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap',
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

                {selectedGif && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
                    <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '10px', display: 'block' }} />
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

                <form onSubmit={handleAddComment} style={{ position: 'relative', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setCommentFocused(true)}
                    onBlur={() => setCommentFocused(false)}
                    placeholder="Add a comment..."
                    maxLength={500}
                    style={{
                      flex: 1, minWidth: 0, padding: '0.6rem 0.9rem', borderRadius: '999px',
                      border: '1px solid ' + (commentFocused ? '#b31f2f' : 'rgba(255,255,255,0.1)'),
                      backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem',
                      boxShadow: commentFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                  />

                  <div>
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
                        borderRadius: '999px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', flexShrink: 0,
                        transition: 'background-color 0.15s, border-color 0.15s'
                      }}
                    >
                      GIF
                    </button>
                    {showGiphy && (
                      <GiphyPicker
                        onSelect={(url) => { setSelectedGif(url); setShowGiphy(false) }}
                        onClose={() => setShowGiphy(false)}
                        // Anchored to the form, so never wider than it.
                        style={{ width: 'min(320px, 100%)' }}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!newComment.trim() && !selectedGif}
                    style={{
                      padding: isMobile ? '0.6rem 1rem' : '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none', flexShrink: 0,
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
                      <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: '0.5rem', rowGap: '0.1rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{ fontWeight: '700', fontSize: '0.85rem', color: 'white', cursor: comment.commenter_id?._id !== currentUserId ? 'pointer' : 'default' }}
                            onClick={() => comment.commenter_id?._id !== currentUserId && goToUser(comment.commenter_id?._id)}
                          >
                            {comment.commenter_id?.username || comment.commenter_id?.email}
                          </span>
                          <span style={{ color: '#555', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{formatDate(comment.createdAt)}</span>
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
                            style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '8px', display: 'block', marginTop: comment.comment ? '0.5rem' : 0 }}
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
                )}
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

      {showTrailer && tmdbMovie?.trailer_key && (
        <TrailerModal trailerKey={tmdbMovie.trailer_key} onClose={() => setShowTrailer(false)} />
      )}
    </>
  )
}

export default MovieDetailModal
