import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import useIsMobile from '../../hooks/useIsMobile'
import SearchModal from '../Movies/SearchModal'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'
import TwoFactorSetup from './TwoFactorSetup'
import ConfirmModal from '../UI/ConfirmModal'
import GenreSidebar from '../UI/GenreSidebar'
import ImageCropModal from '../UI/ImageCropModal'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Emoji from '../UI/Emoji'
import Navbar from '../UI/Navbar'
import ProfileMenu from '../UI/ProfileMenu'
import Avatar from '../UI/Avatar'
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
      .movie-carousel { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .movie-carousel::-webkit-scrollbar { display: none; }
    `}</style>
    {movies.map((movie, i) => (
      <div
        key={movie._id || movie.tmdb_id || i}
        onClick={() => onClick(movie)}
        style={{
          cursor: 'pointer', transition: 'transform 0.2s',
          ...(isMobile ? { flexShrink: 0, width: '128px', scrollSnapAlign: 'start' } : {})
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

const StatCard = ({ count, label, icon, isOpen, onClick, isMobile }) => (
  <div
    onClick={onClick}
    style={{
      textAlign: 'center', cursor: 'pointer', position: 'relative',
      backgroundColor: isOpen ? 'rgba(179,31,47,0.14)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isOpen ? 'rgba(179,31,47,0.45)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: isMobile ? '10px' : '14px',
      padding: isMobile ? '0.55rem 0.4rem' : '0.9rem 1.5rem',
      transition: 'background-color 0.2s, border-color 0.2s, transform 0.2s',
      // On mobile, sharing the row equally (instead of a fixed minWidth) is
      // what keeps all three side by side on a narrow screen instead of
      // wrapping to a second line.
      ...(isMobile ? { flex: '1 1 0', minWidth: 0 } : { minWidth: '112px' })
    }}
    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
  >
    {!isMobile && <span style={{ position: 'absolute', top: '0.6rem', right: '0.75rem', fontSize: '0.85rem', opacity: isOpen ? 0.9 : 0.45 }}>{icon}</span>}
    <p style={{ fontSize: isMobile ? '1.2rem' : '1.9rem', fontWeight: 800, margin: 0, lineHeight: 1, color: isOpen ? '#dc3c4f' : 'white' }}>{count}</p>
    <p style={{
      color: '#999', margin: isMobile ? '0.25rem 0 0 0' : '0.4rem 0 0 0', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      fontSize: isMobile ? '0.58rem' : '0.72rem',
      whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: isMobile ? 'hidden' : 'visible', textOverflow: isMobile ? 'ellipsis' : 'clip'
    }}>{label}</p>
    {!isMobile && (
      <p style={{ color: isOpen ? '#dc3c4f' : '#555', margin: '0.35rem 0 0 0', fontSize: '0.68rem', fontWeight: 600 }}>{isOpen ? '▲ Hide' : '▼ Show'}</p>
    )}
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
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [genreMovies, setGenreMovies] = useState([])
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const isMobile = useIsMobile()
  // Sidebar defaults collapsed on mobile (it'd otherwise cover the whole
  // screen on first load) and open on desktop, matching its own width.
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [watchedOpen, setWatchedOpen] = useState(false)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
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
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
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

  const fetchGenreMovies = async (genre, fromYear = yearFrom, toYear = yearTo) => {
    if (selectedGenre?.id === genre.id && !fromYear && !toYear) {
      setSelectedGenre(null)
      setGenreMovies([])
      return
    }
    setSelectedGenre(genre)
    try {
      let url = `/movies/genre/${genre.id}`
      const params = []
      if (fromYear) params.push(`yearFrom=${fromYear}`)
      if (toYear) params.push(`yearTo=${toYear}`)
      if (params.length) url += `?${params.join('&')}`
      const res = await api.get(url)
      setGenreMovies(res.data)
    } catch (err) {
      console.error('Failed to load genre movies')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/user/profile')
      localStorage.removeItem('user')
      navigate('/login')
    } catch (err) {
      console.error('Failed to delete account')
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
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
          onOpen2FA={() => setShow2FASetup(true)}
          onLogout={handleLogout}
          onDeleteAccount={() => setShowDeleteAccount(true)}
        />
        
      </Navbar>

      {/* Main Layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-h))' }}>

        <GenreSidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={(genre) => {
            fetchGenreMovies(genre)
            // A mobile drawer should get out of the way once its job (picking
            // a filter) is done, rather than making you dismiss it separately
            // to see the results it just filtered.
            if (isMobile) setSidebarOpen(false)
          }}
          onClose={() => setSidebarOpen(false)}
          yearFrom={yearFrom}
          yearTo={yearTo}
          onYearFromChange={(val) => {
            setYearFrom(val)
            if (selectedGenre) fetchGenreMovies(selectedGenre, val, yearTo)
          }}
          onYearToChange={(val) => {
            setYearTo(val)
            if (selectedGenre) fetchGenreMovies(selectedGenre, yearFrom, val)
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

          {/* Profile Info */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(179,31,47,0.1) 0%, rgba(255,255,255,0.03) 55%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '1.75rem 2.25rem', marginBottom: '2rem'
          }}>
            <div style={{
              position: 'absolute', top: '-70px', left: '-70px', width: '220px', height: '220px',
              background: 'radial-gradient(circle, rgba(179,31,47,0.28) 0%, transparent 70%)', pointerEvents: 'none'
            }} />

            <div style={{
              position: 'relative', display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center', textAlign: isMobile ? 'center' : 'left',
              gap: isMobile ? '1.25rem' : '1.75rem'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ borderRadius: '50%', boxShadow: '0 6px 18px rgba(179,31,47,0.4)' }}>
                  <Avatar user={user} size={92} onClick={() => document.getElementById('photoInput').click()} />
                </div>
                <div
                  onClick={() => document.getElementById('photoInput').click()}
                  style={{
                    position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#b31f2f',
                    border: '2px solid #0a0a0a', borderRadius: '50%', width: '26px', height: '26px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    fontSize: '0.72rem', lineHeight: '1', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    transform: 'scale(1)', transition: 'background-color 0.15s, transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#dc3c4f'
                    e.currentTarget.style.transform = 'scale(1.12)'
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(179,31,47,0.55)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#b31f2f'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
                  }}
                >
                  📷
                </div>
                <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>

              <div style={{ flex: isMobile ? 'none' : 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
                <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{user.username || user.email}</h2>
                <p style={{ color: '#999', margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '0.4rem' }}>
                  <span>📅</span> Member since {formatDate(user.createdAt)}
                </p>
              </div>

              {!isMobile && (
                <div style={{ width: '1px', height: '56px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)', flexShrink: 0 }} />
              )}

              <div style={{
                display: 'flex', gap: isMobile ? '0.5rem' : '1rem', flexShrink: 0,
                justifyContent: isMobile ? 'center' : 'flex-start',
                width: isMobile ? '100%' : undefined
              }}>
                <StatCard
                  count={watchedMovies.length}
                  label="Movies Watched"
                  icon="🎬"
                  isOpen={watchedOpen}
                  onClick={() => setWatchedOpen(!watchedOpen)}
                  isMobile={isMobile}
                />
                <StatCard
                  count={watchlist.length}
                  label="To Watch"
                  icon="🎯"
                  isOpen={watchlistOpen}
                  onClick={() => setWatchlistOpen(!watchlistOpen)}
                  isMobile={isMobile}
                />
                <StatCard
                  count={favorites.length}
                  label="Favorites"
                  icon="❤️"
                  isOpen={favoritesOpen}
                  onClick={() => setFavoritesOpen(!favoritesOpen)}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>

          {/* My Watched Movies */}
          <Collapsible open={watchedOpen}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🎬 My Watched Movies</h3>
            {watchedMovies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
                <p style={{ color: '#aaa' }}>No watched movies yet!</p>
              </div>
            ) : (
              <MovieGrid movies={watchedMovies} onClick={setSelectedWatchedMovie} isMobile={isMobile} />
            )}
          </Collapsible>

          {/* Watchlist */}
          <Collapsible open={watchlistOpen}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🎯 Movies to Watch</h3>
            {watchlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</p>
                <p style={{ color: '#aaa' }}>No movies in your watchlist yet!</p>
              </div>
            ) : (
              <MovieGrid
                movies={watchlist.map(m => ({ ...m, tmdb_id: m.movie_id, title: m.movie_title, poster_url: m.movie_poster, year: m.movie_year }))}
                onClick={(movie) => setSelectedTrendingMovie(movie)}
                isMobile={isMobile}
              />
            )}
          </Collapsible>

          {/* Favorites */}
          <Collapsible open={favoritesOpen}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>❤️ Favorite Movies</h3>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❤️</p>
                <p style={{ color: '#aaa' }}>No favorite movies yet!</p>
              </div>
            ) : (
              <MovieGrid
                movies={favorites.map(m => ({ ...m, tmdb_id: m.movie_id, title: m.movie_title, poster_url: m.movie_poster, year: m.movie_year }))}
                onClick={(movie) => setSelectedTrendingMovie(movie)}
                isMobile={isMobile}
              />
            )}
          </Collapsible>

          {/* Genre Movies */}
          {selectedGenre && (
            <>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
                🎭 {selectedGenre.name}
                {(yearFrom || yearTo) && (
                  <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                    ({yearFrom || '...'} — {yearTo || '...'})
                  </span>
                )}
              </h3>
              {genreMovies.length === 0 ? (
                <p style={{ color: '#aaa', marginBottom: '2rem' }}>No movies found.</p>
              ) : (
                <MovieGrid movies={genreMovies} onClick={(movie) => setSelectedTrendingMovie(movie)} isMobile={isMobile} />
              )}
            </>
          )}

          {/* Trending Movies */}
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🔥 Trending This Week</h3>
          {trendingMovies.length === 0 ? (
            <p style={{ color: '#aaa' }}>Loading...</p>
          ) : (
            <MovieGrid movies={trendingMovies} onClick={(movie) => setSelectedTrendingMovie(movie)} isMobile={isMobile} />
          )}

          {/* Upcoming Movies */}
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🎟️ Coming Soon</h3>
          {upcomingMovies.length === 0 ? (
            <p style={{ color: '#aaa' }}>Loading...</p>
          ) : (
            <MovieGrid movies={upcomingMovies} onClick={(movie) => setSelectedTrendingMovie(movie)} isMobile={isMobile} />
          )}
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

      {showDeleteAccount && (
        <ConfirmModal
          icon="⚠️"
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone!"
          confirmText="Delete"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteAccount(false)}
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