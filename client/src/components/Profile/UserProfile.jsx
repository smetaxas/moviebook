import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation, useNavigationType } from 'react-router-dom'
import api from '../../api/axios'
import { resumeAfter } from '../../utils/navState'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import { profileStyles, ProfileHeader, ProfileLists } from './ProfileParts'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import Avatar from '../UI/Avatar'
import UserNotFound from '../UserNotFound'
import useIsMobile from '../../hooks/useIsMobile'


function UserProfile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [favorites, setFavorites] = useState([])
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [selectedWatchlistMovie, setSelectedWatchlistMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [error, setError] = useState('')
  // Which list is showing, and how "Watched" is sorted. Reset per profile.
  const [tab, setTab] = useState('watched')
  const [sort, setSort] = useState('recent')
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const isMobile = useIsMobile()

  const goBack = () => {
    const { backTo, ...reopenState } = location.state || {}
    if (backTo) {
      navigate(backTo, { state: reopenState })
    } else if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      // Nothing to go back to (profile opened directly, e.g. in a new tab).
      navigate('/profile')
    }
  }

  // Another user's page reuses this component — start them clean (reset
  // during render when the id changes, React's pattern for this, so the
  // previous person's data never flashes up).
  const [shownUserId, setShownUserId] = useState(userId)
  if (shownUserId !== userId) {
    setShownUserId(userId)
    setUser(null)
    setWatchedMovies([])
    setWatchlist([])
    setFavorites([])
    setTab('watched')
    setSort('recent')
  }

  useEffect(() => {
    fetchUser()
    fetchWatchedMovies()
    fetchWatchlist()
    fetchFavorites()
  }, [userId])

  // Arriving back here after "Go Back" from someone else's profile —
  // reopen the watched-movie modal we came from. Guarded on !backTo: when
  // backTo IS present, this state is just passing through (carried by a
  // comment-avatar click) for our own "Go Back" to forward later, not
  // something to act on immediately.
  //
  // Runs on every navigation, not just on mount: /user/A -> /user/B reuses
  // this same component instance, so a mount-only effect never saw the trip
  // back from B to A. The modal wasn't reopened and — worse — the original
  // backTo was never restored, leaving "Back" to fall through to browser
  // history, which bounced between A and B forever.
  useEffect(() => {
    if (location.state?.reopenWatchedMovie && !location.state?.backTo) {
      setSelectedWatchlistMovie(null)
      setSelectedWatchedMovie({ _id: location.state.reopenWatchedMovie })
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    } else if (location.state?.reopenMovieDetails && !location.state?.backTo) {
      setSelectedWatchedMovie(null)
      setSelectedWatchlistMovie(location.state.reopenMovieDetails)
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    } else if (navigationType === 'PUSH') {
      // A fresh forward arrival (e.g. clicked a commenter inside a movie
      // modal on another user's profile): that modal belonged to the page
      // we just left, so it shouldn't still be open over this one. Not on
      // REPLACE — that's our own state clean-up just above.
      setSelectedWatchedMovie(null)
      setSelectedWatchlistMovie(null)
      setMovieToLog(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const fetchUser = async () => {
    try {
      const res = await api.get(`/user/profile/${userId}`)
      setUser(res.data)
    } catch (err) {
      setError('User not found')
    }
  }

  const fetchWatchedMovies = async () => {
    try {
      const res = await api.get(`/user/profile/${userId}/watched`)
      setWatchedMovies(res.data)
    } catch (err) {
      console.error('Failed to load watched movies')
    }
  }

  const fetchWatchlist = async () => {
    try {
      const res = await api.get(`/watchlist/user/${userId}`)
      setWatchlist(res.data)
    } catch (err) {
      console.error('Failed to load watchlist')
    }
  }

  const fetchFavorites = async () => {
    try {
      const res = await api.get(`/favorites/user/${userId}`)
      setFavorites(res.data)
    } catch (err) {
      console.error('Failed to load favorites')
    }
  }


  const name = user?.username || 'This user'

  if (error) return <UserNotFound onGoBack={goBack} />

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <style>{profileStyles}</style>
      <Navbar>
        <BackButton onClick={goBack}>Back</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '1100px', margin: '0 auto' }}>

        {user?.restricted ? (
          // A private account: just who it is, and that its lists aren't shared.
          <div style={{
            position: 'relative', overflow: 'hidden', maxWidth: '520px', margin: isMobile ? '0.5rem auto 0' : '2rem auto 0',
            textAlign: 'center', borderRadius: '22px', padding: isMobile ? '2rem 1.25rem' : '2.5rem 2rem',
            background: 'linear-gradient(160deg, rgba(179,31,47,0.12) 0%, rgba(255,255,255,0.03) 60%)',
            border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', animation: 'upFadeIn 0.35s ease'
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '260px', height: '260px',
              background: 'radial-gradient(circle, rgba(179,31,47,0.25) 0%, transparent 70%)', pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative', display: 'inline-block', borderRadius: '50%', boxShadow: '0 6px 18px rgba(179,31,47,0.35)' }}>
              <Avatar user={user} size={92} />
              <span aria-hidden="true" style={{
                position: 'absolute', right: '-2px', bottom: '-2px', width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                backgroundColor: '#b31f2f', border: '3px solid #141414'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              </span>
            </div>
            <h1 style={{ position: 'relative', margin: '1rem 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, overflowWrap: 'anywhere' }}>{user.username}</h1>
            <p style={{ position: 'relative', margin: 0, color: '#888', fontSize: '0.85rem' }}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
            <div style={{
              position: 'relative', margin: '1.4rem auto 0', padding: '1rem 1.1rem', borderRadius: '14px', maxWidth: '400px',
              backgroundColor: 'rgba(179,31,47,0.1)', border: '1px solid rgba(220,60,79,0.35)', textAlign: 'left',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M12 3.5L2.5 20h19z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r="0.6" fill="#ff6b7d" />
              </svg>
              <div>
                <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>This account is private</p>
                <p style={{ margin: '0.25rem 0 0', color: '#aaa', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {user.username} has chosen to keep their watched movies, watchlist, favorites and activity private.
                </p>
              </div>
            </div>
          </div>
        ) : (<>
        <ProfileHeader
          user={user}
          layout={isMobile ? 'narrow' : 'wide'}
          avatar={size => <Avatar user={user} size={size} expandOnClick />}
          watchedMovies={watchedMovies}
          watchlistCount={watchlist.length}
          favoritesCount={favorites.length}
          activeTab={tab}
          onStatClick={setTab}
        />

        <ProfileLists
          tab={tab}
          titles={{ watched: 'Watched movies', watchlist: 'Watchlist', favorites: 'Favorite movies' }}
          sort={sort} onSortChange={setSort}
          watchedMovies={watchedMovies} watchlist={watchlist} favorites={favorites}
          loading={!user}
          isMobile={isMobile}
          emptyText={{
            watched: `${name} hasn't logged any movies yet.`,
            watchlist: `${name}'s watchlist is empty.`,
            favorites: `${name} hasn't picked any favorites yet.`
          }}
          onOpenWatched={setSelectedWatchedMovie}
          onOpenListMovie={setSelectedWatchlistMovie}
        />
        </>)}
      </div>

      <ScrollToTopButton />

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie._id}
          initialMovie={selectedWatchedMovie}
          onClose={() => setSelectedWatchedMovie(null)}
        />
      )}

      {selectedWatchlistMovie && (
        <TMDBMovieModal
          movie={selectedWatchlistMovie}
          onClose={() => setSelectedWatchlistMovie(null)}
          onLogMovie={(movie) => {
            setSelectedWatchlistMovie(null)
            setMovieToLog(movie)
          }}
        />
      )}

      {movieToLog && (
        <LogMovieModal
          movie={movieToLog}
          onClose={() => setMovieToLog(null)}
          onLogged={() => setMovieToLog(null)}
        />
      )}
    </div>
  )
}

export default UserProfile
