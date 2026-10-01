import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import { prefetchMovie } from '../../api/movieCache'
import { buildNavState, resumeAfter } from '../../utils/navState'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import Avatar from '../UI/Avatar'
import GiphyPicker from '../UI/GiphyPicker'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'
import FadeInImage from '../UI/FadeInImage'
import useIsMobile from '../../hooks/useIsMobile'

const feedStyles = `
  @keyframes cfFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes cfPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @keyframes cfSpin { to { transform: rotate(360deg); } }
  .cf-search, .cf-composer { transition: border-color 0.2s, box-shadow 0.2s; }
  .cf-search:focus-within, .cf-composer:focus-within { border-color: rgba(220,60,79,0.75) !important; box-shadow: 0 0 0 3px rgba(179,31,47,0.18) !important; }
  .cf-search-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
  .cf-poster { cursor: pointer; min-width: 0; transition: transform 0.2s; -webkit-tap-highlight-color: transparent; }
  .cf-poster:active { transform: scale(0.97); }
  .cf-poster .cf-poster-img { transition: box-shadow 0.2s; }
  .cf-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.6rem; border-radius: 999px; font-size: 0.74rem; font-weight: 700; color: #ddd; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); white-space: nowrap; }
  .cf-btn { padding: 0.5rem 0.95rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: white; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); transition: background-color 0.15s; -webkit-tap-highlight-color: transparent; }
  .cf-btn-primary { background: #b31f2f; border-color: #b31f2f; box-shadow: 0 4px 14px rgba(179,31,47,0.35); }
  .cf-send, .cf-gif, .cf-icon-btn, .cf-delete, .cf-hero-poster { -webkit-tap-highlight-color: transparent; transition: background-color 0.15s, color 0.15s, opacity 0.15s; }
  @media (hover: hover) {
    .cf-poster:hover { transform: translateY(-4px); }
    .cf-poster:hover .cf-poster-img { box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 0 2px rgba(220,60,79,0.6); }
    .cf-btn:hover { background: rgba(255,255,255,0.15); transform: none; filter: none; }
    .cf-btn-primary:hover { background: #dc3c4f; }
    .cf-name:hover { color: #ff6b7d; }
    .cf-delete:hover { color: #dc3c4f !important; background: rgba(179,31,47,0.12) !important; transform: none; filter: none; }
    .cf-gif:hover, .cf-icon-btn:hover { background: rgba(255,255,255,0.16) !important; transform: none; filter: none; }
    .cf-send:not(:disabled):hover { background: #dc3c4f !important; transform: none; filter: none; }
    .cf-hero-poster:hover { transform: none; filter: brightness(1.1); }
  }
`

const icon = (children, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const ICONS = {
  search: icon(<><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>),
  trash: icon(<><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /></>, 14),
  send: icon(<><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></>, 17),
}

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric'
})

// "just now", "5m ago", "3h ago", "2d ago", then the date.
const timeAgo = (dateString) => {
  const s = (Date.now() - new Date(dateString)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return 'on ' + new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const StarRating = ({ rating, size = 13 }) => (
  <span style={{ display: 'inline-flex', gap: '1px', verticalAlign: 'middle' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#ff4d61' : 'rgba(255,255,255,0.18)' }}>★</span>
    ))}
  </span>
)

// One comment box: the text, a GIF button and send, all in one pill, with
// the chosen GIF previewed above it.
function Composer({ value, onChange, onSubmit, gif, onRemoveGif, giphyOpen, onToggleGiphy, onPickGif, onCloseGiphy, busy, placeholder }) {
  const canSend = (value.trim() || gif) && !busy
  return (
    <form onSubmit={onSubmit}>
      {gif && (
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.6rem' }}>
          <img src={gif} alt="Selected GIF" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '10px', display: 'block' }} />
          <button type="button" onClick={onRemoveGif} aria-label="Remove GIF" style={{
            position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', padding: 0,
            borderRadius: '50%', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      )}
      <div className="cf-composer" style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.3rem 0.3rem 0.95rem',
        borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          aria-label={placeholder}
          style={{ flex: 1, minWidth: 0, padding: '0.45rem 0', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '16px' }}
        />
        <button type="button" className="cf-gif" onClick={onToggleGiphy} aria-label="Add a GIF" aria-pressed={giphyOpen} style={{
          flexShrink: 0, height: '32px', padding: '0 0.65rem', borderRadius: '999px', cursor: 'pointer',
          backgroundColor: giphyOpen ? 'rgba(179,31,47,0.2)' : 'rgba(255,255,255,0.07)',
          border: '1px solid ' + (giphyOpen ? 'rgba(220,60,79,0.5)' : 'transparent'),
          color: giphyOpen ? '#ff6b7d' : '#ccc', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em'
        }}>GIF</button>
        <button type="submit" className="cf-send" disabled={!canSend} aria-label="Post comment" style={{
          flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%', border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#b31f2f', color: 'white', cursor: canSend ? 'pointer' : 'default', opacity: canSend ? 1 : 0.35
        }}>
          {busy
            ? <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'cfSpin 0.7s linear infinite' }} />
            : ICONS.send}
        </button>
        {giphyOpen && (
          <GiphyPicker
            onSelect={onPickGif}
            onClose={onCloseGiphy}
            // Anchored to the comment box, so never wider than it.
            style={{ width: 'min(320px, 100%)' }}
          />
        )}
      </div>
    </form>
  )
}

function CommunityFeed() {
  const [query, setQuery] = useState('')
  // What was typed in the search box when the current movie was picked —
  // restored when going back from its comments to the search.
  const [searchBeforeSelect, setSearchBeforeSelect] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [newComments, setNewComments] = useState({})
  const [selectedGifs, setSelectedGifs] = useState({})
  const [showGiphyFor, setShowGiphyFor] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [newMovieComment, setNewMovieComment] = useState('')
  const [showMovieGiphy, setShowMovieGiphy] = useState(false)
  const [selectedMovieGif, setSelectedMovieGif] = useState(null)
  const [loggingComment, setLoggingComment] = useState(false)
  const [showMovieDetails, setShowMovieDetails] = useState(false)
  const [movieToLog, setMovieToLog] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId
  const commentsRef = useRef(null)

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/movies/search?q=${encodeURIComponent(query.trim())}`)
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
    navigate(`/user/${userId}`, { state: buildNavState(location, { reopenMovie: selectedMovie, reopenQuery: searchBeforeSelect }) })
  }

  // Returning to wherever a movie's own "Community Comments" button sent us
  // from (see goToCommunityComments in TMDBMovieModal/MovieDetailModal) —
  // translates the returnReopen* payload it carried through back into the
  // standard reopenWatchedMovie/reopenMovieDetails fields `backTo` already
  // knows how to consume, same "go back and reopen" contract PersonDetail
  // and UserProfile's own goBack use.
  //
  // No backTo means we got here from the navbar's Community button on the
  // Profile page (the only other way in). That case deliberately doesn't
  // use browser history: returning from a commenter's profile PUSHES this
  // page again, so history's previous entry is that profile — "Back" from
  // the comments would bounce straight back to it. Instead it steps back
  // through this page's own levels: comments -> search -> Profile.
  const backToSearch = () => {
    setSelectedMovie(null)
    setWatchedMovies([])
    setQuery(searchBeforeSelect)
  }

  const goBack = () => {
    const { backTo, returnReopenWatchedMovie, returnReopenMovieDetails } = location.state || {}
    if (!backTo) {
      if (selectedMovie) backToSearch()
      else navigate('/profile')
      return
    }
    const reopenState = {}
    if (returnReopenWatchedMovie !== undefined) reopenState.reopenWatchedMovie = returnReopenWatchedMovie
    if (returnReopenMovieDetails) reopenState.reopenMovieDetails = returnReopenMovieDetails
    navigate(backTo, { state: reopenState })
  }

  const handleSelectMovie = async (movie, previousQuery = query) => {
    setSelectedMovie(movie)
    setSearchBeforeSelect(previousQuery)
    setQuery('')
    setSearchResults([])
    setLoading(true)
    try {
      await fetchWatchedForMovie(movie.tmdb_id)
    } catch (err) {
      console.error('Failed to load movie data')
    } finally {
      setLoading(false)
    }
  }

  // Arriving back from a user's profile (e.g. clicked a commenter's name/photo),
  // or from a "Jump to Comments" button on a movie's detail modal elsewhere in
  // the app — reopen that movie's comment thread and scroll straight to it
  // instead of landing on a blank feed. Unlike the reopen effects on other
  // pages, this doesn't guard on `!backTo` before consuming: showing the
  // comment thread IS the whole point of that "Jump to Comments" button, not
  // an incidental payload to carry through untouched. So instead, backTo
  // (and any returnReopen* carried alongside it for the trip back) is
  // preserved across the state replace below, for this page's own goBack.
  useEffect(() => {
    const carryForward = () => {
      const { backTo, returnReopenWatchedMovie, returnReopenMovieDetails } = location.state || {}
      return {
        ...(resumeAfter(location) || {}),
        ...(backTo ? { backTo } : {}),
        ...(returnReopenWatchedMovie !== undefined ? { returnReopenWatchedMovie } : {}),
        ...(returnReopenMovieDetails ? { returnReopenMovieDetails } : {})
      }
    }

    if (location.state?.reopenMovieDetails) {
      handleSelectMovie(location.state.reopenMovieDetails, location.state.reopenQuery || '').then(() => {
        setShowMovieDetails(true)
      })
      navigate(location.pathname, { replace: true, state: carryForward() })
    } else if (location.state?.reopenMovie) {
      handleSelectMovie(location.state.reopenMovie, location.state.reopenQuery || '').then(() => {
        requestAnimationFrame(() => scrollToComments())
      })
      navigate(location.pathname, { replace: true, state: carryForward() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for new ratings/logs/comments (from any user, including yourself) while a movie is open
  useEffect(() => {
    if (!selectedMovie) return
    const interval = setInterval(() => {
      fetchWatchedForMovie(selectedMovie.tmdb_id).catch(() => {
        console.error('Failed to refresh watched movies')
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedMovie])

  // Commenting on a movie you haven't logged yet creates (or reuses) your own
  // unrated log and attaches the comment to it — there's no separate,
  // movie-wide discussion thread anymore.
  const handleAddMovieComment = async (e) => {
    e.preventDefault()
    if ((!newMovieComment.trim() && !selectedMovieGif) || !selectedMovie) return
    setLoggingComment(true)
    try {
      await api.post(`/watched/comment/${selectedMovie.tmdb_id}`, {
        comment: newMovieComment,
        gif_url: selectedMovieGif,
        movie_title: selectedMovie.title,
        movie_poster: selectedMovie.poster_url,
        movie_year: selectedMovie.year
      })
      await fetchWatchedForMovie(selectedMovie.tmdb_id)
      setNewMovieComment('')
      setSelectedMovieGif(null)
    } catch (err) {
      console.error('Failed to add movie comment')
    } finally {
      setLoggingComment(false)
    }
  }

  const handleAddComment = async (watchedMovieId) => {
    const comment = newComments[watchedMovieId]
    const gif_url = selectedGifs[watchedMovieId]
    if (!comment?.trim() && !gif_url) return
    try {
      const res = await api.post(`/comments/${watchedMovieId}`, { comment, gif_url })
      setWatchedMovies(prev => prev.map(w => {
        if (w._id === watchedMovieId) {
          return { ...w, comments: [res.data, ...w.comments] }
        }
        return w
      }))
      setNewComments(prev => ({ ...prev, [watchedMovieId]: '' }))
      setSelectedGifs(prev => ({ ...prev, [watchedMovieId]: null }))
    } catch (err) {
      console.error('Failed to add comment')
    }
  }

  const handleDeleteComment = async (watchedMovieId, commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`)
      if (res.data.deletedLog) {
        // That was the last comment on an unrated log — the log itself just
        // got deleted server-side too, so drop its whole card from the feed.
        setWatchedMovies(prev => prev.filter(w => w._id !== watchedMovieId))
        return
      }
      setWatchedMovies(prev => prev.map(w => {
        if (w._id === watchedMovieId) {
          return { ...w, comments: w.comments.filter(c => c._id !== commentId) }
        }
        return w
      }))
    } catch (err) {
      console.error('Failed to delete comment')
    }
  }


  const hasOwnLog = watchedMovies.some(w => w.user_id?._id === currentUserId)
  const ratedLogs = watchedMovies.filter(w => w.rating > 0)
  const avgRating = ratedLogs.length ? (ratedLogs.reduce((n, w) => n + w.rating, 0) / ratedLogs.length).toFixed(1) : null
  const commentCount = watchedMovies.reduce((n, w) => n + (w.comments?.length || 0), 0)
  const posterMin = isMobile ? '96px' : '125px'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <style>{feedStyles}</style>
      <Navbar>
        <BackButton onClick={goBack}>Back</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '760px', margin: '0 auto' }}>

        {/* ---------- Picking a movie ---------- */}
        {!selectedMovie && (
          <>
            <div style={{ textAlign: 'center', margin: isMobile ? '0.5rem 0 1.25rem' : '0.75rem 0 1.75rem' }}>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', margin: '0 0 0.45rem 0', color: '#dc3c4f', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <span style={{ width: '3px', height: '0.8rem', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
                Community
              </p>
              <h2 style={{ margin: '0 0 0.4rem 0', fontSize: isMobile ? '1.55rem' : '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                What's everyone watching?
              </h2>
              {/* Always one line: never wraps, and the text scales down with
                  the screen width on small phones instead (full size from
                  ~450px up). */}
              <p style={{ color: '#999', margin: 0, fontSize: 'clamp(0.6rem, 3.2vw, 0.9rem)', lineHeight: 1.45, whiteSpace: 'nowrap' }}>
                Pick a movie and see what everyone's saying about it.
              </p>
            </div>

            <div className="cf-search" style={{
              position: 'relative', display: 'flex', alignItems: 'center', height: '54px', borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginBottom: isMobile ? '1.25rem' : '1.75rem'
            }}>
              <span style={{ display: 'flex', padding: '0 0.75rem 0 1.05rem', color: inputFocused ? '#dc3c4f' : '#777', transition: 'color 0.2s' }}>
                {searching
                  ? <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(220,60,79,0.25)', borderTopColor: '#dc3c4f', animation: 'cfSpin 0.7s linear infinite' }} />
                  : ICONS.search}
              </span>
              <input
                type="search"
                className="cf-search-input"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Search for a movie..."
                aria-label="Search for a movie"
                style={{
                  flex: 1, minWidth: 0, height: '100%', padding: 0, border: 'none', background: 'transparent',
                  color: 'white', outline: 'none', fontSize: isMobile ? '16px' : '1rem'
                }}
              />
              {query && (
                <button type="button" className="cf-icon-btn" onClick={() => setQuery('')} aria-label="Clear search" style={{
                  width: '30px', height: '30px', margin: '0 0.6rem', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.08)', color: '#ccc', fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>✕</button>
              )}
            </div>

            {searching && searchResults.length === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${posterMin}, 1fr))`, gap: isMobile ? '1rem 0.65rem' : '1.4rem 1rem' }}>
                {Array.from({ length: isMobile ? 6 : 10 }, (_, i) => (
                  <div key={i}>
                    <div style={{ aspectRatio: '2 / 3', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)', animation: 'cfPulse 1.3s ease-in-out infinite' }} />
                    <div style={{ height: '0.7rem', width: '75%', borderRadius: '4px', marginTop: '0.55rem', backgroundColor: 'rgba(255,255,255,0.06)', animation: 'cfPulse 1.3s ease-in-out infinite' }} />
                  </div>
                ))}
              </div>
            )}

            {!searching && query.trim() && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', animation: 'cfFadeIn 0.25s ease' }}>
                <p style={{ color: 'white', fontWeight: 700, margin: '0 0 0.3rem 0', overflowWrap: 'anywhere' }}>No movies found for “{query.trim()}”</p>
                <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>Check the spelling, or try fewer words.</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${posterMin}, 1fr))`,
                gap: isMobile ? '1rem 0.65rem' : '1.4rem 1rem', opacity: searching ? 0.55 : 1, transition: 'opacity 0.2s',
                animation: 'cfFadeIn 0.25s ease'
              }}>
                {searchResults.map(movie => (
                  <div key={movie.tmdb_id} className="cf-poster" onClick={() => handleSelectMovie(movie)} onMouseEnter={() => prefetchMovie(movie.tmdb_id)}>
                    <div className="cf-poster-img" style={{ aspectRatio: '2 / 3', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#1a1a1a', boxShadow: '0 6px 16px rgba(0,0,0,0.4)' }}>
                      {movie.poster_url
                        ? <FadeInImage src={movie.poster_url} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.72rem' }}>No poster</div>}
                    </div>
                    {/* Two lines max, so one long title doesn't make its cell taller
                        than its neighbours and knock the row out of line. */}
                    <p style={{
                      fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 700, lineHeight: 1.25, margin: '0.5rem 0 0.15rem 0',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>{movie.title}</p>
                    <p style={{ color: '#8a8a8a', fontSize: '0.72rem', margin: 0 }}>{movie.year || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------- The movie's community page ---------- */}
        {selectedMovie && (
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: '20px', marginBottom: isMobile ? '1.1rem' : '1.5rem',
            border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backgroundColor: '#141414',
            animation: 'cfFadeIn 0.3s ease'
          }}>
            {/* the poster, blurred, as the backdrop */}
            {selectedMovie.poster_url && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: '-40px', backgroundImage: `url(${selectedMovie.poster_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.45) saturate(1.2)'
              }} />
            )}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.85) 70%)' }} />

            <div style={{ position: 'relative', display: 'flex', gap: isMobile ? '1rem' : '1.4rem', alignItems: 'center', padding: isMobile ? '1rem' : '1.4rem 1.6rem' }}>
              <button type="button" className="cf-hero-poster" onClick={() => setShowMovieDetails(true)} onMouseEnter={() => prefetchMovie(selectedMovie.tmdb_id)}
                aria-label={`${selectedMovie.title} details`}
                style={{ flexShrink: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                {selectedMovie.poster_url
                  ? <img src={selectedMovie.poster_url} alt="" style={{ width: isMobile ? '78px' : '100px', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '10px', display: 'block', boxShadow: '0 10px 26px rgba(0,0,0,0.6)' }} />
                  : <div style={{ width: isMobile ? '78px' : '100px', aspectRatio: '2 / 3', borderRadius: '10px', backgroundColor: '#222' }} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1.15rem' : '1.45rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
                  {selectedMovie.title}
                  {selectedMovie.year && <span style={{ color: '#aaa', fontWeight: 500 }}> ({selectedMovie.year})</span>}
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                  <span className="cf-chip">{loading ? '…' : watchedMovies.length} {watchedMovies.length === 1 ? 'log' : 'logs'}</span>
                  {avgRating && <span className="cf-chip"><span style={{ color: '#ff4d61' }}>★</span> {avgRating} avg</span>}
                  <span className="cf-chip">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: isMobile ? '0.75rem' : '0.95rem' }}>
                  <button type="button" className="cf-btn cf-btn-primary" onClick={() => setShowMovieDetails(true)}>Details</button>
                  <button type="button" className="cf-btn" onClick={backToSearch}>Change movie</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{ height: '150px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', animation: 'cfPulse 1.3s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        <div ref={commentsRef} style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>

        {/* Log this movie yourself, via a comment — there's no comment without a log:
            posting here creates your own (unrated) log and attaches the comment to it.
            Hidden once you already have a log for this movie; add more comments there instead. */}
        {!loading && selectedMovie && !hasOwnLog && (
          <div style={{
            backgroundColor: 'rgba(179,31,47,0.07)', border: '1px solid rgba(220,60,79,0.25)',
            borderRadius: '18px', padding: isMobile ? '1rem' : '1.15rem 1.4rem', marginBottom: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.98rem', fontWeight: 800 }}>Join the conversation</h3>
            <p style={{ color: '#999', fontSize: '0.8rem', margin: '0 0 0.9rem 0' }}>Commenting logs the movie for you — you can rate it later from your profile.</p>
            <Composer
              value={newMovieComment}
              onChange={setNewMovieComment}
              onSubmit={handleAddMovieComment}
              gif={selectedMovieGif}
              onRemoveGif={() => setSelectedMovieGif(null)}
              giphyOpen={showMovieGiphy}
              onToggleGiphy={() => setShowMovieGiphy(v => !v)}
              onPickGif={(url) => { setSelectedMovieGif(url); setShowMovieGiphy(false) }}
              onCloseGiphy={() => setShowMovieGiphy(false)}
              busy={loggingComment}
              placeholder="What did you think?"
            />
          </div>
        )}

        {!loading && selectedMovie && watchedMovies.length === 0 && (
          <div style={{ textAlign: 'center', padding: isMobile ? '2.25rem 1rem' : '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '2.3rem', margin: '0 0 0.6rem 0' }}>🍿</p>
            <p style={{ color: 'white', fontWeight: 700, margin: '0 0 0.25rem 0' }}>No one has logged this yet</p>
            <p style={{ color: '#999', margin: 0, fontSize: '0.88rem' }}>Be the first to say what you thought.</p>
          </div>
        )}

        {!loading && watchedMovies.length > 0 && (
          <p style={{ color: '#777', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.75rem 0.15rem' }}>
            From the community
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.9rem' : '1.1rem' }}>
          {!loading && watchedMovies.map(watched => {
            const isOwn = watched.user_id?._id === currentUserId
            const author = watched.user_id?.username || watched.user_id?.email
            return (
              <article key={watched._id} className="cf-log" style={{
                backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: '18px',
                border: '1px solid ' + (isOwn ? 'rgba(220,60,79,0.3)' : 'rgba(255,255,255,0.08)'),
                animation: 'cfFadeIn 0.3s ease'
              }}>
                {/* Who logged it, their rating, when */}
                <div style={{ padding: isMobile ? '0.9rem 1rem 0.75rem' : '1.1rem 1.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Avatar user={watched.user_id} size={isMobile ? 40 : 44} onClick={!isOwn ? () => goToUser(watched.user_id?._id) : undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span
                        className={isOwn ? undefined : 'cf-name'}
                        onClick={() => !isOwn && goToUser(watched.user_id?._id)}
                        style={{ fontWeight: 800, fontSize: '0.95rem', cursor: isOwn ? 'default' : 'pointer', overflowWrap: 'anywhere' }}
                      >{author}</span>
                      {isOwn && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ff6b7d', backgroundColor: 'rgba(179,31,47,0.16)', border: '1px solid rgba(220,60,79,0.35)', borderRadius: '999px', padding: '0.1rem 0.45rem', letterSpacing: '0.05em' }}>YOU</span>}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.78rem', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {watched.rating ? <StarRating rating={watched.rating} /> : <span style={{ color: '#666', fontStyle: 'italic' }}>Not rated</span>}
                      <span style={{ color: '#444' }}>•</span>
                      <span title={formatDate(watched.watchedAt)}>watched {timeAgo(watched.watchedAt)}</span>
                    </p>
                  </div>
                </div>

                <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 1.4rem 1.2rem' }}>
                  {watched.comments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '0.15rem 0 1rem', paddingLeft: isMobile ? '0.25rem' : '0.4rem', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                      {watched.comments.map(comment => {
                        const mine = comment.commenter_id?._id === currentUserId
                        return (
                          <div key={comment._id} className="cf-comment" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', paddingLeft: '0.6rem' }}>
                            <Avatar user={comment.commenter_id} size={30} onClick={!mine ? () => goToUser(comment.commenter_id?._id) : undefined} />
                            <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: '0.5rem' }}>
                                <span className={mine ? undefined : 'cf-name'} onClick={() => !mine && goToUser(comment.commenter_id?._id)}
                                  style={{ fontWeight: 700, fontSize: '0.84rem', cursor: mine ? 'default' : 'pointer' }}>
                                  {comment.commenter_id?.username || comment.commenter_id?.email}
                                </span>
                                <span title={formatDate(comment.createdAt)} style={{ color: '#666', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{timeAgo(comment.createdAt)}</span>
                                {mine && (
                                  <button type="button" className="cf-delete" onClick={() => handleDeleteComment(watched._id, comment._id)} aria-label="Delete comment" title="Delete comment"
                                    style={{ marginLeft: 'auto', alignSelf: 'center', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0.2rem', display: 'flex', borderRadius: '6px' }}>
                                    {ICONS.trash}
                                  </button>
                                )}
                              </div>
                              {comment.comment && <p style={{ color: '#ddd', margin: '0.15rem 0 0 0', fontSize: '0.9rem', lineHeight: 1.45 }}>{comment.comment}</p>}
                              {comment.gif_url && (
                                <img src={comment.gif_url} alt="GIF" loading="lazy" style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '10px', display: 'block', marginTop: '0.45rem' }} />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontSize: '0.84rem', margin: '0.1rem 0 0.9rem' }}>
                      {isOwn ? 'No comments on your log yet.' : `No comments yet — tell ${author} what you think.`}
                    </p>
                  )}

                  {!isOwn && (
                    <Composer
                      value={newComments[watched._id] || ''}
                      onChange={(v) => setNewComments(prev => ({ ...prev, [watched._id]: v }))}
                      onSubmit={(e) => { e.preventDefault(); handleAddComment(watched._id) }}
                      gif={selectedGifs[watched._id]}
                      onRemoveGif={() => setSelectedGifs(prev => ({ ...prev, [watched._id]: null }))}
                      giphyOpen={showGiphyFor === watched._id}
                      onToggleGiphy={() => setShowGiphyFor(showGiphyFor === watched._id ? null : watched._id)}
                      onPickGif={(url) => { setSelectedGifs(prev => ({ ...prev, [watched._id]: url })); setShowGiphyFor(null) }}
                      onCloseGiphy={() => setShowGiphyFor(null)}
                      placeholder={`Reply to ${author}...`}
                    />
                  )}
                </div>
              </article>
            )
          })}
        </div>

        </div>
      </div>

      <ScrollToTopButton />

      {showMovieDetails && selectedMovie && (
        <TMDBMovieModal
          movie={selectedMovie}
          onClose={() => setShowMovieDetails(false)}
          onLogMovie={(movie) => { setShowMovieDetails(false); setMovieToLog(movie) }}
          onWatchlistChange={() => {}}
          onFavoriteChange={() => {}}
          hideCommunityLink
        />
      )}

      {movieToLog && (
        <LogMovieModal
          movie={movieToLog}
          onClose={() => setMovieToLog(null)}
          onLogged={() => { setMovieToLog(null); fetchWatchedForMovie(selectedMovie.tmdb_id) }}
        />
      )}
    </div>
  )
}

export default CommunityFeed
