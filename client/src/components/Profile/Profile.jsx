import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SearchModal from '../Movies/SearchModal'
import MovieDetailModal from '../Movies/MovieDetailModal'
import TMDBMovieModal from '../Movies/TMDBMovieModal'
import TwoFactorSetup from './TwoFactorSetup'
import ConfirmModal from '../UI/ConfirmModal'

function Profile() {
  const [user, setUser] = useState(null)
  const [watchedMovies, setWatchedMovies] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null)
  const [selectedTrendingMovie, setSelectedTrendingMovie] = useState(null)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [movieToLog, setMovieToLog] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
    fetchWatchedMovies()
    fetchTrendingMovies()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile')
      setUser(res.data)
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

  const fetchTrendingMovies = async () => {
    try {
      const res = await api.get('/movies/trending')
      setTrendingMovies(res.data)
    } catch (err) {
      console.error('Failed to load trending movies')
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
    const formData = new FormData()
    formData.append('photo', file)
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      {/* Navbar */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(229,9,20,0.3)',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎬</span>
          <span style={{ fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Cine<span style={{ color: '#e50914' }}>Log</span>
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.25rem', backgroundColor: '#e50914',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            🔍 Search
          </button>
          <button
            onClick={() => navigate('/feed')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🌍 Community
          </button>

          {/* Avatar Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                cursor: 'pointer', padding: '0.25rem 0.75rem',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt="Profile"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#e50914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  {(user.username || user.email)[0].toUpperCase()}
                </div>
              )}
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>▾</span>
            </div>

            {showDropdown && (
              <>
                <div
                  onClick={() => setShowDropdown(false)}
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}
                />
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '0.5rem',
                  minWidth: '200px', zIndex: 201,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
                    <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{user.username}</p>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShow2FASetup(true); setShowDropdown(false) }}
                    style={{
                      width: '100%', padding: '0.6rem 1rem', backgroundColor: 'transparent',
                      color: user.two_factor_enabled ? '#00c800' : 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      textAlign: 'left', fontSize: '0.9rem'
                    }}
                  >
                    {user.two_factor_enabled ? '🔐 2FA On' : '🔓 Enable 2FA'}
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowDropdown(false) }}
                    style={{
                      width: '100%', padding: '0.6rem 1rem', backgroundColor: 'transparent',
                      color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                      textAlign: 'left', fontSize: '0.9rem'
                    }}
                  >
                    🚪 Logout
                  </button>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => { setShowDeleteAccount(true); setShowDropdown(false) }}
                      style={{
                        width: '100%', padding: '0.6rem 1rem', backgroundColor: 'transparent',
                        color: '#e50914', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        textAlign: 'left', fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Info */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt="Profile"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => document.getElementById('photoInput').click()}
              />
            ) : (
              <div
                onClick={() => document.getElementById('photoInput').click()}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  backgroundColor: '#e50914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', cursor: 'pointer'
                }}
              >
                {(user.username || user.email)[0].toUpperCase()}
              </div>
            )}
            <div
              onClick={() => document.getElementById('photoInput').click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                backgroundColor: '#333', borderRadius: '50%',
                width: '24px', height: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.7rem'
              }}
            >
              📷
            </div>
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>

          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{user.username || user.email}</h2>
            <p style={{ color: '#aaa', margin: 0 }}>Member since {formatDate(user.createdAt)}</p>
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{watchedMovies.length}</p>
            <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Movies Watched</p>
          </div>
        </div>

        {/* My Watched Movies */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>My Watched Movies</h3>
        {watchedMovies.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '2rem'
          }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ color: '#aaa' }}>No watched movies yet. Search and log some movies!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {watchedMovies.map(movie => (
              <div
                key={movie._id}
                onClick={() => setSelectedWatchedMovie(movie._id)}
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
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>⭐ {movie.rating}/5</p>
              </div>
            ))}
          </div>
        )}

        {/* Trending Movies */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🔥 Trending This Week</h3>
        {trendingMovies.length === 0 ? (
          <p style={{ color: '#aaa' }}>Loading trending movies...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {trendingMovies.map(movie => (
              <div
                key={movie.tmdb_id}
                onClick={() => setSelectedTrendingMovie(movie)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '225px', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#aaa' }}>No Poster</span>
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{movie.title}</p>
                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>{movie.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWatchedMovie && (
        <MovieDetailModal
          watchedMovieId={selectedWatchedMovie}
          onClose={() => setSelectedWatchedMovie(null)}
          onDeleted={fetchWatchedMovies}
          onRatingUpdated={fetchWatchedMovies}
        />
      )}

      {selectedTrendingMovie && (
        <TMDBMovieModal
          movie={selectedTrendingMovie}
          onClose={() => setSelectedTrendingMovie(null)}
          onLogMovie={(movie) => {
            setSelectedTrendingMovie(null)
            setMovieToLog(movie)
          }}
        />
      )}

      {movieToLog && (
        <SearchModal
          onClose={() => setMovieToLog(null)}
          onMovieLogged={() => {
            fetchWatchedMovies()
            setMovieToLog(null)
          }}
        />
      )}

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onMovieLogged={fetchWatchedMovies}
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
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteAccount(false)}
          />
    )}
    </div>
  )
}

export default Profile