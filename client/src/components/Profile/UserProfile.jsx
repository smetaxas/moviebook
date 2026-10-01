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
