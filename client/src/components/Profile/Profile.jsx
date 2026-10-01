import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import useElementWidth from '../../hooks/useElementWidth'
import SearchModal from '../Movies/SearchModal'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'
import TwoFactorSetup from './TwoFactorSetup'
import GenreSidebar from '../UI/GenreSidebar'
import ImageCropModal from '../UI/ImageCropModal'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Emoji from '../UI/Emoji'
import Navbar from '../UI/Navbar'
import ProfileMenu from '../UI/ProfileMenu'
import Avatar from '../UI/Avatar'
import { profileStyles, ProfileHeader, ProfileLists } from './ProfileParts'
import { TrendingSection, UpcomingSection } from './DiscoverSections'
import { prefetchMovie } from '../../api/movieCache'
import { resumeAfter } from '../../utils/navState'

// On mobile this becomes a horizontally-swipeable row of fixed-width cards
// (TMDB's own mobile pattern for Trending/Popular/etc.) instead of a
// vertical grid — a scrollbar-free, snap-scrolling carousel with a peek of
// the next card at the edge as the scroll affordance.
const MovieGrid = ({ movies, onClick, isMobile }) => (
  <div
    className={isMobile ? 'movie-carousel' : undefined}
    style={isMobile
      // overscrollBehaviorX: 'contain' stops this carousel's own scroll
      // momentum from chaining into whatever scrollable ancestor is behind
      // it once the carousel hits its start/end — the other half of fixing
      // "swiping a carousel drags the whole page sideways" (see Main
      // Content's overflowX: 'hidden' below for the rest of it).
      ? { display: 'flex', gap: '0.85rem', overflowX: 'auto', overscrollBehaviorX: 'contain', paddingBottom: '0.5rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }
      : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}
  >
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .movie-carousel { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .movie-carousel::-webkit-scrollbar { display: none; }
    `}</style>
    {movies.map((movie, i) => (
      <div
        key={movie._id || movie.tmdb_id || i}
        onClick={() => onClick(movie)}
        style={{
          cursor: 'pointer', transition: 'transform 0.2s',
          ...(isMobile ? { flexShrink: 0, width: '128px' } : {})
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; prefetchMovie(movie.movie_id || movie.tmdb_id) }}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {(movie.movie_poster || movie.poster_url) ? (
          <img src={movie.movie_poster || movie.poster_url} alt={movie.movie_title || movie.title} style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#aaa' }}>No Poster</span>
          </div>
        )}
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{movie.movie_title || movie.title}</p>
        <p style={{ fontSize: '0.75rem', color: movie.release_date ? '#b31f2f' : '#aaa', margin: 0 }}>
          {movie.release_date ? <Emoji>{`📅 ${movie.release_date}`}</Emoji> : movie.rating ? <Emoji>{`⭐ ${movie.rating}/5`}</Emoji> : (movie.movie_year || movie.year || 'Not rated')}
        </p>
      </div>
    ))}
  </div>
)

// Animates a section open/closed by transitioning its grid row from 0fr to
// 1fr — unlike max-height, this doesn't need a guessed cap and settles at
// exactly the content's real height. Kept mounted while closed (rather than
// conditionally rendered) so the collapse itself is what animates, not a hard cut.
const Collapsible = ({ open, children }) => (
  <div style={{
    display: 'grid', gridTemplateRows: open ? '1fr' : '0fr',
    transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  }}>
    {/* overflowX stays hidden even while open (unlike overflowY, which goes
        visible so nothing near the bottom gets clipped) — this section
        wraps a horizontal movie carousel on mobile, and 'visible' here was
        exactly the gap that let its scroll gesture chain out to the whole
        page once the carousel hit its own scroll limit. */}
    <div style={{ overflowY: open ? 'visible' : 'hidden', overflowX: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 0.25s ease ' + (open ? '0.05s' : '0s') }}>
      {children}
    </div>
  </div>
)

function Profile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [favorites, setFavorites] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [upcomingMovies, setUpcomingMovies] = useState([])
  const [genres, setGenres] = useState([])
  // Several genres can be combined; the results are movies that are ALL of
  // them (Comedy + Romance = romantic comedies).
  const [selectedGenres, setSelectedGenres] = useState([])
  const [genreMovies, setGenreMovies] = useState([])
  const [genreLoading, setGenreLoading] = useState(false)
  // Tapping genres quickly fires overlapping requests; only the latest one
  // may update the results.
  const genreRequestRef = useRef(0)
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const isMobile = useIsMobile()
  // The info card lays itself out from its OWN width, not the screen's: with
  // the sidebar open on a tablet or small laptop the card is far narrower
  // than the viewport, and the one-row desktop layout doesn't fit.
  const [infoCardRef, infoCardWidth] = useElementWidth()
  const cardLayout = infoCardWidth === null
    ? (isMobile ? 'narrow' : 'wide')
    : infoCardWidth < 480 ? 'narrow' : infoCardWidth < 860 ? 'medium' : 'wide'
  // Sidebar defaults collapsed on mobile (it'd otherwise cover the whole
  // screen on first load) and open on desktop, matching its own width.
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  // Which of your lists is showing under the card (folded away by default);
  // tapping a stat opens its list, tapping it again folds it back up.
  const [listOpen, setListOpen] = useState(false)
  const [listTab, setListTab] = useState('watched')
  const [sort, setSort] = useState('recent')
  const toggleList = (key) => {
    if (listOpen && listTab === key) {
      setListOpen(false)
    } else {
      setListTab(key)
      setListOpen(true)
    }
  }
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  // What to pre-fill the search modal with when it's being reopened after
  // "← Back" from a person's page reached via search (see the reopenSearch
  // effect below) — { mode, query } or null for a fresh, empty search.
  const [searchReopenState, setSearchReopenState] = useState(null)
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [selectedTrendingMovie, setSelectedTrendingMovie] = useState(null)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FAPrompt, setShow2FAPrompt] = useState(false)
  const [movieToLog, setMovieToLog] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchProfile()
    fetchWatchedMovies()
    fetchWatchlist()
    fetchFavorites()
    fetchTrendingMovies()
    fetchUpcomingMovies()
    fetchGenres()
  }, [])

  // Arriving back here after "Go Back" from someone else's profile, or from
  // a cast/director page — reopen whichever movie modal (or search) we came
  // from.
  useEffect(() => {
    if (location.state?.reopenWatchedMovie && !location.state?.backTo) {
      setSelectedWatchedMovie({ _id: location.state.reopenWatchedMovie })
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    } else if (location.state?.reopenMovieDetails && !location.state?.backTo) {
      setSelectedTrendingMovie(location.state.reopenMovieDetails)
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    } else if (location.state?.reopenSearch && !location.state?.backTo) {
      setSearchReopenState(location.state.reopenSearch)
      setShowSearch(true)
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile')
      setUser(res.data)
      if (!res.data.two_factor_enabled && !sessionStorage.getItem('2fa_prompt_shown')) {
        setShow2FAPrompt(true)
        sessionStorage.setItem('2fa_prompt_shown', 'true')
      }
    } catch (err) {
      setError('Failed to load profile')
    }
  }

  const fetchWatchedMovies = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const res = await api.get(`/watched/user/${userData.userId}`)
      setWatchedMovies(res.data)
    } catch (err) {
      console.error('Failed to load watched movies')
    }
  }

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist')
      setWatchlist(res.data)
    } catch (err) {
      console.error('Failed to load watchlist')
    }
  }

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites')
      setFavorites(res.data)
    } catch (err) {
      console.error('Failed to load favorites')
    }
  }

  const fetchTrendingMovies = async () => {
    try {
      const res = await api.get('/movies/trending')
      setTrendingMovies(res.data)
    } catch (err) {
      console.error('Failed to load trending movies')
    }
  }

  const fetchUpcomingMovies = async () => {
    try {
      const res = await api.get('/movies/upcoming')
      setUpcomingMovies(res.data)
    } catch (err) {
      console.error('Failed to load upcoming movies')
    }
  }

  const fetchGenres = async () => {
    try {
      const res = await api.get('/movies/genres')
      setGenres(res.data)
    } catch (err) {
      console.error('Failed to load genres')
    }
  }

  // Clicking a genre adds it to the combination, or removes it if it's
  // already in it. Works from a ref, not the rendered state: two quick taps
  // can land before React re-renders, and the second would otherwise start
  // from the selection before the first tap (undoing it).
  const selectedGenresRef = useRef([])
  const applyGenreSelection = (next) => {
    selectedGenresRef.current = next
    setSelectedGenres(next)
    loadGenreMovies(next, yearFrom, yearTo)
  }
  const toggleGenre = (genre) => {
    const current = selectedGenresRef.current
    applyGenreSelection(current.some(g => g.id === genre.id)
      ? current.filter(g => g.id !== genre.id)
      : [...current, genre])
  }
  const clearGenres = () => applyGenreSelection([])

  // (Re)loads the movies for a genre combination — also used when only the
  // year range changes.
  const loadGenreMovies = async (genreList, fromYear, toYear) => {
    const requestId = ++genreRequestRef.current
    if (genreList.length === 0) {
      setGenreMovies([])
      setGenreLoading(false)
      return
    }
    setGenreLoading(true)
    try {
      let url = `/movies/genre/${genreList.map(g => g.id).join(',')}`
      const params = []
      if (fromYear) params.push(`yearFrom=${fromYear}`)
      if (toYear) params.push(`yearTo=${toYear}`)
      if (params.length) url += `?${params.join('&')}`
      const res = await api.get(url)
      if (requestId === genreRequestRef.current) setGenreMovies(res.data)
    } catch (err) {
      console.error('Failed to load genre movies')
    } finally {
      if (requestId === genreRequestRef.current) setGenreLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob) => {
    setShowCropModal(false)
    setCropImageSrc(null)

    const formData = new FormData()
    formData.append('photo', croppedBlob, 'profile.jpg')
    try {
      const res = await api.post('/user/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUser(prev => ({ ...prev, profile_photo: res.data.profile_photo }))
      fetchProfile()
    } catch (err) {
      console.error('Failed to upload photo', err)
    }
  }

  if (error) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>{error}</p>
  if (!user) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>

  // Shared with both the desktop nav buttons and the mobile hamburger
  // dropdown below, so the two don't drift out of sync with each other.
  const navActions = [
    {
      key: 'search',
      label: 'Search',
      variant: 'solid',
      onClick: () => { setSearchReopenState(null); setShowSearch(true) },
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.3" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    },
    {
      key: 'community',
      label: 'Community',
      onClick: () => navigate('/feed'),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="2" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    {
      key: 'stats',
      label: 'Stats',
      onClick: () => navigate('/stats'),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <line x1="5" y1="21" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="21" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="19" y1="21" x2="19" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    }
  ]

  // overflowX: 'clip' below is a last-resort backstop — the actual scroll
  // boundary for page content is Main Content further down, but this
  // guarantees the page itself can never be dragged sideways no matter what
  // a future addition does upstream. It must be 'clip', not 'hidden':
  // 'hidden' makes this div a scroll container, which silently breaks the
  // sidebar's position: sticky (it sticks to this div instead of the
  // viewport, so it scrolls away with the page).
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', overflowX: 'clip' }}>
      <style>{profileStyles}</style>
      <Navbar
        actions={navActions}
        // On mobile the sidebar is a drawer, and the tiny chevron below is
        // too small a tap target — it gets a full-size Filters button at the
        // far left of the bar instead.
        leading={isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={sidebarOpen}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, padding: 0,
              backgroundColor: sidebarOpen ? 'rgba(179,31,47,0.18)' : 'rgba(255,255,255,0.08)',
              border: '1px solid ' + (sidebarOpen ? 'rgba(179,31,47,0.6)' : 'rgba(255,255,255,0.15)'),
              color: sidebarOpen ? '#dc3c4f' : 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.15s, border-color 0.15s, color 0.15s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="17" x2="20" y2="17" />
              <circle cx="9" cy="7" r="2.2" fill="currentColor" />
              <circle cx="15" cy="17" r="2.2" fill="currentColor" />
            </svg>
          </button>
        )}
        leftExtra={!isMobile &&
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: 'translate(-50%, 50%) scale(1)',
              width: '19px',
              height: '19px',
              borderRadius: '50%',
              background: 'linear-gradient(160deg, #1c1c1c 0%, #0c0c0c 100%)',
              border: '1px solid rgba(179,31,47,0.5)',
              color: '#b31f2f',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              zIndex: 101,
              boxShadow: '0 2px 10px rgba(0,0,0,0.55), 0 0 0 4px rgba(0,0,0,0.95)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1.1)'
              e.currentTarget.style.boxShadow = '0 2px 14px rgba(179,31,47,0.5), 0 0 0 4px rgba(0,0,0,0.95)'
              e.currentTarget.style.borderColor = '#b31f2f'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.55), 0 0 0 4px rgba(0,0,0,0.95)'
              e.currentTarget.style.borderColor = 'rgba(179,31,47,0.5)'
            }}
          >
            <svg
              width="8" height="8" viewBox="0 0 24 24" fill="none"
              style={{
                transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <path d="M5 8.5L12 15.5L19 8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      >
        <ProfileMenu
          user={user}
          onLogout={handleLogout}
        />
        
      </Navbar>

      {/* Main Layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-h))' }}>

        <GenreSidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          genres={genres}
          selectedGenres={selectedGenres}
          // The drawer stays open on phones while you pick a combination; its
          // "Show movies" button closes it.
          onToggleGenre={toggleGenre}
          onClearGenres={clearGenres}
          onClose={() => setSidebarOpen(false)}
          yearFrom={yearFrom}
          yearTo={yearTo}
          onYearFromChange={(val) => {
            setYearFrom(val)
            if (selectedGenres.length) loadGenreMovies(selectedGenres, val, yearTo)
          }}
          onYearToChange={(val) => {
            setYearTo(val)
            if (selectedGenres.length) loadGenreMovies(selectedGenres, yearFrom, val)
          }}
          // Both ends at once (decade shortcuts, Clear): one state update and
          // one request, instead of two where the second used a stale year.
          onYearRangeChange={(from, to) => {
            setYearFrom(from)
            setYearTo(to)
            if (selectedGenres.length) loadGenreMovies(selectedGenres, from, to)
          }}
        />

        {/* Main Content */}
        {/* minWidth: 0 is defensive (a flex item's default min-width: auto
            can otherwise refuse to shrink below its content's intrinsic
            width). The real fix for "swiping a carousel drags the whole
            page sideways" is overflowX: 'hidden' here: this column only
            ever needs to scroll vertically — the movie carousels below
            handle their own horizontal scrolling internally — so once a
            carousel hits the end of its own scroll, there's no horizontal
            scroll left on this parent for that gesture to chain into. With
            plain overflow: 'auto' (both axes) that chaining is exactly what
            was happening. */}
        <div style={{ flex: 1, minWidth: 0, padding: 'var(--page-pad)', overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Profile info — same card as other users' pages, laid out from its
              own width (see cardLayout); plus the photo upload button. */}
          <ProfileHeader
            cardRef={infoCardRef}
            showJoined={false}
            user={user}
            layout={cardLayout}
            avatar={size => (
              // Your photo: tap it (or the camera badge) to change it. On a
              // mouse, hovering the photo also shows a "Change" overlay.
              <div className="pf-avatar" style={{ position: 'relative' }}>
                <style>{`
                  .pf-avatar-hit { position: relative; display: block; padding: 0; border: none; background: none; border-radius: 50%; cursor: pointer; -webkit-tap-highlight-color: transparent; }
                  .pf-avatar-overlay { position: absolute; inset: 0; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
                    background: rgba(10,10,10,0.6); color: white; font-size: 0.68rem; font-weight: 700; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
                  .pf-camera { position: absolute; right: -2px; bottom: -2px; width: 32px; height: 32px; padding: 0; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;
                    background: linear-gradient(135deg, #e0394f 0%, #b31f2f 100%); border: 3px solid #161616;
                    box-shadow: 0 4px 12px rgba(179,31,47,0.45); transition: transform 0.15s, box-shadow 0.15s; -webkit-tap-highlight-color: transparent; }
                  .pf-camera:active, .pf-avatar-hit:active { transform: scale(0.94); }
                  @media (hover: hover) {
                    .pf-avatar:hover .pf-avatar-overlay { opacity: 1; }
                    .pf-avatar-hit:hover { transform: none; filter: none; }
                    .pf-camera:hover { transform: scale(1.08); filter: none; box-shadow: 0 6px 16px rgba(179,31,47,0.6); }
                  }
                `}</style>
                <button type="button" className="pf-avatar-hit" onClick={() => document.getElementById('photoInput').click()} aria-label="Change profile photo">
                  <Avatar user={user} size={size} />
                  <span className="pf-avatar-overlay" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.4" />
                    </svg>
                    Change
                  </span>
                </button>
                <button type="button" className="pf-camera" onClick={() => document.getElementById('photoInput').click()} aria-label="Change profile photo" title="Change photo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.4" />
                  </svg>
                </button>
                <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>
            )}
            watchedMovies={watchedMovies}
            watchlistCount={watchlist.length}
            favoritesCount={favorites.length}
            activeTab={listOpen ? listTab : null}
            onStatClick={toggleList}
          />

          {/* Your lists stay folded away until you open one, so Trending and
              Coming Soon are still right there under the card. */}
          <Collapsible open={listOpen}>
            <ProfileLists
              tab={listTab}
              titles={{ watched: 'Your watched movies', watchlist: 'Your watchlist', favorites: 'Your favorites' }}
              sort={sort} onSortChange={setSort}
              watchedMovies={watchedMovies} watchlist={watchlist} favorites={favorites}
              isMobile={isMobile}
              emptyText={{
                watched: 'No watched movies yet!',
                watchlist: 'No movies in your watchlist yet!',
                favorites: 'No favorite movies yet!'
              }}
              onOpenWatched={setSelectedWatchedMovie}
              onOpenListMovie={setSelectedTrendingMovie}
            />
          </Collapsible>


          {/* Genre Movies — the combination as removable chips */}
          {selectedGenres.length > 0 && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, marginRight: '0.15rem' }}>🎭</span>
                  {selectedGenres.map((g, i) => (
                    <span key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      {i > 0 && <span style={{ color: '#dc3c4f', fontWeight: 800 }}>+</span>}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.3rem 0.35rem 0.3rem 0.75rem', borderRadius: '999px',
                        backgroundColor: 'rgba(179,31,47,0.16)', border: '1px solid rgba(220,60,79,0.5)',
                        color: 'white', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700
                      }}>
                        {g.name}
                        <button
                          onClick={() => toggleGenre(g)}
                          aria-label={`Remove ${g.name}`}
                          style={{
                            width: '20px', height: '20px', borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer',
                            backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '0.7rem', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >✕</button>
                      </span>
                    </span>
                  ))}
                  {selectedGenres.length > 1 && (
                    <button
                      onClick={clearGenres}
                      style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.3rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p style={{ color: '#999', fontSize: '0.82rem', margin: '0.5rem 0 0 0' }}>
                  {genreLoading ? 'Loading…' : `${genreMovies.length} ${genreMovies.length === 1 ? 'movie' : 'movies'}`}
                  {(yearFrom || yearTo) && ` · ${yearFrom || '…'} – ${yearTo || 'now'}`}
                  {selectedGenres.length > 1 && !genreLoading && ' · matching all selected genres'}
                </p>
              </div>
              {genreLoading && genreMovies.length === 0 ? null : genreMovies.length === 0 ? (
                <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                  {selectedGenres.length > 1
                    ? 'No movies are all of these genres — try removing one.'
                    : 'No movies found.'}
                </p>
              ) : (
                <MovieGrid movies={genreMovies} onClick={(movie) => setSelectedTrendingMovie(movie)} isMobile={isMobile} />
              )}
            </>
          )}

          <TrendingSection movies={trendingMovies} onOpen={setSelectedTrendingMovie} isMobile={isMobile} />
          <UpcomingSection movies={upcomingMovies} onOpen={setSelectedTrendingMovie} isMobile={isMobile} />
        </div>
      </div>

      <ScrollToTopButton />

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie._id}
          initialMovie={selectedWatchedMovie}
          onClose={() => setSelectedWatchedMovie(null)}
          onDeleted={fetchWatchedMovies}
          onRatingUpdated={fetchWatchedMovies}
        />
      )}

      {selectedTrendingMovie && (
        <TMDBMovieModal
          movie={selectedTrendingMovie}
          onClose={() => setSelectedTrendingMovie(null)}
          onWatchlistChange={fetchWatchlist}
          onFavoriteChange={fetchFavorites}
          onLogMovie={(movie) => {
            setSelectedTrendingMovie(null)
            setMovieToLog(movie)
          }}
        />
      )}

      {movieToLog && (
        <LogMovieModal
          movie={movieToLog}
          onClose={() => setMovieToLog(null)}
          onLogged={() => {
            fetchWatchedMovies()
            setMovieToLog(null)
          }}
        />
      )}

      {showSearch && (
        <SearchModal
          onClose={() => { setShowSearch(false); setSearchReopenState(null) }}
          onMovieLogged={fetchWatchedMovies}
          onWatchlistChange={fetchWatchlist}
          onFavoriteChange={fetchFavorites}
          initialQuery={searchReopenState?.query}
          initialMode={searchReopenState?.mode}
        />
      )}

      {show2FASetup && (
        <TwoFactorSetup
          onClose={() => setShow2FASetup(false)}
          isEnabled={user.two_factor_enabled}
          onEnabled={() => setUser(prev => ({ ...prev, two_factor_enabled: true }))}
          onDisabled={() => setUser(prev => ({ ...prev, two_factor_enabled: false }))}
        />
      )}

      {showCropModal && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => { setShowCropModal(false); setCropImageSrc(null) }}
        />
      )}

      {/* 2FA Prompt */}
      {show2FAPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px',
            width: '90%', maxWidth: '400px',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</p>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Enable Two-Factor Authentication</h3>
            <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Add an extra layer of security to your account with 2FA. You can enable it anytime from your profile settings.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => { setShow2FAPrompt(false); setShow2FASetup(true) }}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#b31f2f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Enable 2FA
              </button>
              <button
                onClick={() => setShow2FAPrompt(false)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#aaa', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile