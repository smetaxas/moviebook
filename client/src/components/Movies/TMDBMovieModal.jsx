import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import useModalTransition, { modalTransitionKeyframes } from '../../hooks/useModalTransition'
import { fetchMovie, getCachedMovie } from '../../api/movieCache'
import { prefetchPerson } from '../../api/personCache'
import Emoji from '../UI/Emoji'
import GiphyPicker from '../UI/GiphyPicker'
import Avatar from '../UI/Avatar'
import CommunityRating from '../UI/CommunityRating'
import MovieDetailsSkeleton from '../UI/MovieDetailsSkeleton'
import TrailerModal from '../UI/TrailerModal'
import WatchProviderLogos from '../UI/WatchProviderLogos'
import FadeInImage from '../UI/FadeInImage'
import { buildNavState } from '../../utils/navState'

function TMDBMovieModal({ movie, onClose, onLogMovie, onWatchlistChange, onFavoriteChange, hideCommunityLink }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tmdbMovie, setTmdbMovie] = useState(() => getCachedMovie(movie.tmdb_id))
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
  const [showTrailer, setShowTrailer] = useState(false)
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
  // The poster/backdrop overlap math below is tuned in pixels for a
  // desktop-width backdrop — on a narrow phone screen the same negative
  // margin drags the poster up past the (much shorter, same 16:9 aspect)
  // backdrop entirely. Scale both down together on mobile.
  const isMobile = useIsMobile()
  // Grows out of the clicked poster on open, shrinks back into it on close.
  const { panelRef, overlayStyle, panelStyle, close } = useModalTransition(onClose)

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId

  // Carries enough to reopen this exact movie's details — comments included —
  // when the profile page's "Back" button forwards this state on to the
  // current route, same contract as goToPerson below.
  const goToUser = (userId) => {
    navigate(`/user/${userId}`, {
      state: buildNavState(location, {
        reopenMovieDetails: {
          tmdb_id: movie.tmdb_id,
          title: tmdbMovie?.title || movie.title,
          year: tmdbMovie?.year || movie.year,
          poster_url: tmdbMovie?.poster_url || movie.poster_url,
          release_date: movie.release_date || tmdbMovie?.release_date
        }
      })
    })
  }

  // Carries enough to reopen this exact movie's details when the person
  // page's "Back" button forwards this state on to the current route, plus
  // whatever we already know about the person (name/photo) so their page
  // can render its header instantly instead of waiting on its own fetch.
  const goToPerson = (person) => {
    navigate(`/person/${person.id}?role=${person.role}`, {
      state: buildNavState(location, {
        initialPerson: { id: person.id, name: person.name, profile_url: person.profile_url },
        reopenMovieDetails: {
          tmdb_id: movie.tmdb_id,
          title: tmdbMovie?.title || movie.title,
          year: tmdbMovie?.year || movie.year,
          poster_url: tmdbMovie?.poster_url || movie.poster_url,
          release_date: movie.release_date || tmdbMovie?.release_date
        }
      })
    })
  }

  // "Comments" here are just this user's own log — the real comment section,
  // with every log from the community, lives in the feed. Send them there.
  // `returnReopenMovieDetails` isn't touched by the feed itself — it's
  // carried through so the feed's own "Back" button can hand it to
  // `backTo` (this page) and reopen this exact modal, the same "go back
  // and reopen" contract goToPerson/goToUser use.
  const goToCommunityComments = () => {
    navigate('/feed', {
      state: buildNavState(location, {
        reopenMovie: {
          tmdb_id: movie.tmdb_id,
          title: tmdbMovie?.title || movie.title,
          year: tmdbMovie?.year || movie.year,
          poster_url: tmdbMovie?.poster_url || movie.poster_url
        },
        returnReopenMovieDetails: {
          tmdb_id: movie.tmdb_id,
          title: tmdbMovie?.title || movie.title,
          year: tmdbMovie?.year || movie.year,
          poster_url: tmdbMovie?.poster_url || movie.poster_url,
          release_date: movie.release_date || tmdbMovie?.release_date
        }
      })
    })
  }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [tmdbData, watchlistRes, favoriteRes, providersRes] = await Promise.all([
          fetchMovie(movie.tmdb_id),
          api.get(`/watchlist/check/${movie.tmdb_id}`),
          api.get(`/favorites/check/${movie.tmdb_id}`),
          api.get(`/movies/tmdb/${movie.tmdb_id}/providers?title=${encodeURIComponent(movie.title || '')}`)
        ])
        setTmdbMovie(tmdbData)
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

  const metaLine = tmdbMovie
    ? [tmdbMovie.genres?.join(', '), tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : null, formatDate(tmdbMovie.release_date)]
        .filter(Boolean)
    : []

  // Whether WatchProviderLogos will render the full logo card vs a compact
  // status pill — decides where it sits in the layout below.
  const hasProviders = ['flatrate', 'rent', 'buy'].some(c => providers?.[c]?.length > 0)

  // Whether "Log Movie" should show at all — driven by the actual release
  // date rather than which grid this modal was opened from (movie.release_date,
  // the region-filtered date from the /upcoming list, is preferred over
  // tmdbMovie.release_date — the global /movie/:id primary date, which can
  // already be in the past even for a movie still upcoming in this region).
  // A movie can't have been watched before it's out, regardless of whether
  // it was reached via the Upcoming grid specifically or via
  // Trending/Search/Genre surfacing a title that hasn't released yet.
  const releaseDate = movie.release_date || tmdbMovie?.release_date
  const notYetReleased = releaseDate && releaseDate > new Date().toISOString().split('T')[0]

  return (
    <>
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000, padding: '1rem',
      ...overlayStyle
    }}>
      <div ref={panelRef} style={{
        backgroundColor: '#1a1a1a', borderRadius: '12px',
        width: '100%', maxWidth: '980px',
        maxHeight: '90dvh', overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        ...panelStyle
      }}>
        <style>{`
          @keyframes movieContentFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          ${modalTransitionKeyframes}
        `}</style>

        <button
          onClick={close}
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

        {error && <p style={{ color: '#b31f2f', padding: '2rem' }}>{error}</p>}

        {/* The poster/title header renders immediately from what the caller
            already had (movie prop) rather than waiting on the fetch below —
            only the parts that genuinely need fresh data show a skeleton. */}
        {!error && (
          <>
            {/* Backdrop */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
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

            {/* Poster + title, overlapping the backdrop. The overlap
                (marginTop) and the title column's matching paddingTop are
                tuned together to the poster's height — both scale down on
                mobile so a narrower, shorter poster doesn't drag the
                header up past a backdrop that's now much shorter too
                (same 16:9 aspect, less absolute height). */}
            <div style={{
              display: 'flex', gap: isMobile ? '1rem' : '1.5rem',
              padding: isMobile ? '0 1rem' : '0 2rem',
              marginTop: isMobile ? '-80px' : '-130px',
              position: 'relative', zIndex: 2
            }}>
              {(tmdbMovie?.poster_url || movie.poster_url) && (
                <img
                  src={tmdbMovie?.poster_url || movie.poster_url}
                  alt={tmdbMovie?.title || movie.title}
                  style={{ width: isMobile ? '100px' : '160px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}
                />
              )}
              <div style={{ flex: 1, paddingTop: isMobile ? '82px' : '132px', minWidth: 0 }}>
                <h2 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: '800' }}>
                  {tmdbMovie?.title || movie.title} <span style={{ color: '#aaa', fontWeight: '400' }}>({tmdbMovie?.year || movie.year})</span>
                </h2>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                  {tmdbMovie?.director && (
                    <>
                      <span
                        onClick={() => tmdbMovie.director.id && goToPerson(tmdbMovie.director)}
                        style={{ cursor: tmdbMovie.director.id ? 'pointer' : 'default', transition: 'color 0.15s' }}
                        onMouseEnter={e => { if (tmdbMovie.director.id) { e.currentTarget.style.color = '#dc3c4f'; prefetchPerson(tmdbMovie.director.id, tmdbMovie.director.role) } }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#aaa' }}
                      >
                        {tmdbMovie.director.name}
                      </span>
                      {metaLine.length > 0 && '  ·  '}
                    </>
                  )}
                  {metaLine.join('  ·  ')}
                </p>
              </div>
            </div>

            <div style={{ padding: isMobile ? '1.25rem 1rem 1.5rem 1rem' : '1.5rem 2rem 2rem 2rem' }}>
              {!tmdbMovie ? <MovieDetailsSkeleton /> : (
                <div style={{ animation: 'movieContentFadeIn 0.35s ease' }}>
              {/* Ratings */}
              <CommunityRating average={tmdbMovie.communityRating?.average} count={tmdbMovie.communityRating?.count || 0} />

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

              {/* Actions — on mobile a wrapping row leaves Favorite stranded
                  on its own line, so it's a grid instead: Log Movie (the main
                  action) full width, Watchlist + Favorite split evenly below. */}
              <div style={isMobile
                ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }
                : { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!notYetReleased && (
                  <button
                    onClick={() => onLogMovie(movie)}
                    style={{ gridColumn: '1 / -1', padding: isMobile ? '0.7rem 1rem' : '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
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
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: isMobile ? '0.7rem 0.5rem' : '0.6rem 1.25rem', whiteSpace: 'nowrap',
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
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: isMobile ? '0.7rem 0.5rem' : '0.6rem 1.25rem', whiteSpace: 'nowrap',
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

                {/* When there's nothing to show but a compact status pill
                    (no providers, not yet released, still in theaters —
                    whatever WatchProviderLogos decides), it sits right next
                    to Favorite instead of dropping to its own row below,
                    which only the full provider-logo card needs. */}
                {!hasProviders && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex' }}>
                    <WatchProviderLogos providers={providers} title={tmdbMovie.title} releaseDate={releaseDate} />
                  </div>
                )}
              </div>

              {hasProviders && (
                <div style={{ marginTop: '0.75rem' }}>
                  <WatchProviderLogos providers={providers} title={tmdbMovie.title} releaseDate={releaseDate} />
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', margin: watchedMovieId ? '0 0 1rem 0' : '0 0 0.6rem 0' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap' }}><Emoji>💬</Emoji> Comments ({comments.length})</h3>
                {!hideCommunityLink && (
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
                )}
              </div>
              {!watchedMovieId && (
                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>Commenting logs this movie for you — you can rate it later from your profile.</p>
              )}

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

    {showTrailer && tmdbMovie?.trailer_key && (
      <TrailerModal trailerKey={tmdbMovie.trailer_key} onClose={() => setShowTrailer(false)} />
    )}
    </>
  )
}

export default TMDBMovieModal
