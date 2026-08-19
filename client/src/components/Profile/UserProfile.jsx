import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import LogMovieModal from '../Movies/LogMovieModal'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Emoji from '../UI/Emoji'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
import Avatar from '../UI/Avatar'
import UserNotFound from '../UserNotFound'

const MovieGrid = ({ movies, onClick }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
    animation: 'fadeIn 0.3s ease'
  }}>
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    {movies.map((movie, i) => (
      <div
        key={movie._id || i}
        onClick={() => onClick(movie)}
        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {movie.movie_poster ? (
          <img src={movie.movie_poster} alt={movie.movie_title} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '225px', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#aaa' }}>No Poster</span>
          </div>
        )}
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{movie.movie_title}</p>
        <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>
          {movie.rating ? `⭐ ${movie.rating}/5` : movie.movie_year}
        </p>
      </div>
    ))}
  </div>
)

const StatTile = ({ count, label, icon }) => (
  <div style={{
    textAlign: 'center', position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '0.9rem 1.5rem',
    minWidth: '112px'
  }}>
    <span style={{ position: 'absolute', top: '0.6rem', right: '0.75rem', fontSize: '0.85rem', opacity: 0.45 }}><Emoji>{icon}</Emoji></span>
    <p style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, lineHeight: 1, color: 'white' }}>{count}</p>
    <p style={{ color: '#999', margin: '0.4rem 0 0 0', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
  </div>
)

function UserProfile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [selectedWatchlistMovie, setSelectedWatchlistMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)
  const [error, setError] = useState('')
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    const { backTo, ...reopenState } = location.state || {}
    if (backTo) {
      navigate(backTo, { state: reopenState })
    } else {
      navigate(-1)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchWatchedMovies()
    fetchWatchlist()
  }, [userId])

  // Arriving back here after "Go Back" from someone else's profile —
  // reopen the watched-movie modal we came from. Guarded on !backTo: when
  // backTo IS present, this state is just passing through (carried by a
  // comment-avatar click) for our own "Go Back" to forward later, not
  // something to act on immediately.
  useEffect(() => {
    if (location.state?.reopenWatchedMovie && !location.state?.backTo) {
      setSelectedWatchedMovie(location.state.reopenWatchedMovie)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (error) return <UserNotFound onGoBack={goBack} />
  if (!user) return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <NavButton onClick={goBack}>
          ← Back
        </NavButton>
      </Navbar>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Profile Info */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(179,31,47,0.1) 0%, rgba(255,255,255,0.03) 55%)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
          padding: '1.75rem 2.25rem', marginBottom: '2rem',
          boxShadow: '0 8px 28px rgba(0,0,0,0.35)'
        }}>
          <div style={{
            position: 'absolute', top: '-70px', left: '-70px', width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(179,31,47,0.28) 0%, transparent 70%)', pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: '0 6px 18px rgba(179,31,47,0.4)' }}>
              <Avatar user={user} size={92} expandOnClick />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{user.username || user.email}</h2>
              <p style={{ color: '#999', margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Emoji>📅</Emoji> Member since {formatDate(user.createdAt)}
              </p>
            </div>

            <div style={{ width: '1px', height: '56px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)', flexShrink: 0 }} />

            <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
              <StatTile count={watchedMovies.length} label="Movies Watched" icon="🎬" />
              <StatTile count={watchlist.length} label="To Watch" icon="🎯" />
            </div>
          </div>
        </div>

        {/* Watched Movies */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Watched Movies</h3>
        {watchedMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><Emoji>🎬</Emoji></p>
            <p style={{ color: '#999', margin: 0 }}>No watched movies yet.</p>
          </div>
        ) : (
          <MovieGrid movies={watchedMovies} onClick={(movie) => setSelectedWatchedMovie(movie._id)} />
        )}

        {/* Watchlist */}
        <h3 style={{ margin: '2rem 0 1rem 0', fontSize: '1.2rem' }}><Emoji>🎯</Emoji> Movies to Watch</h3>
        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><Emoji>🎯</Emoji></p>
            <p style={{ color: '#999', margin: 0 }}>No movies in the watchlist yet.</p>
          </div>
        ) : (
          <MovieGrid
            movies={watchlist}
            onClick={(movie) => setSelectedWatchlistMovie({
              tmdb_id: movie.movie_id,
              title: movie.movie_title,
              poster_url: movie.movie_poster,
              year: movie.movie_year
            })}
          />
        )}
      </div>

      <ScrollToTopButton />

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie}
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
