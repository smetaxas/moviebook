import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import TMDBMovieModal from './TMDBMovieModal'
import LogMovieModal from './LogMovieModal'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import Select from '../UI/Select'
import Emoji from '../UI/Emoji'
import { prefetchMovie } from '../../api/movieCache'
import useIsMobile from '../../hooks/useIsMobile'
import { resumeAfter } from '../../utils/navState'

const AWARD_ICONS = { oscars: '🏆', globes: '🌐', bafta: '🎭' }
// Phone tabs share one row in three equal parts — full names don't fit.
const AWARD_SHORT_NAMES = { oscars: 'Oscars', globes: 'Globes', bafta: 'BAFTA' }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title (A-Z)' }
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i)
  .map(year => ({ value: year, label: year }))

const MovieGrid = ({ movies, onClick, isMobile }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--poster-min), 1fr))',
    gap: isMobile ? '0.85rem 0.6rem' : '1.25rem 1rem', marginBottom: '2rem',
    animation: 'fadeIn 0.3s ease'
  }}>
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .award-cell { cursor: pointer; transition: transform 0.2s; -webkit-tap-highlight-color: transparent; }
      .award-cell:active { transform: scale(0.97); }
      /* Zoom on hover only with a real pointer — on a phone it would stick
         after a tap. */
      @media (hover: hover) { .award-cell:hover { transform: scale(1.05); } }
    `}</style>
    {movies.map((movie, i) => (
      <div
        key={movie.tmdb_id || i}
        className="award-cell"
        onClick={() => onClick(movie)}
        onMouseEnter={() => prefetchMovie(movie.tmdb_id)}
      >
        {/* Fixed 2:3 box, so every poster (and every cell) is the same
            height whatever the image's own proportions. */}
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#aaa', fontSize: '0.75rem' }}>No Poster</span>
          </div>
        )}
        <p style={{
          fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 600, lineHeight: 1.25,
          marginTop: '0.45rem', marginBottom: '0.2rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>{movie.title}</p>
        <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#999', margin: 0 }}>
          {movie.year}
        </p>
      </div>
    ))}
  </div>
)

function AwardedMovies() {
  const [awardsMeta, setAwardsMeta] = useState([])
  const [award, setAward] = useState('oscars')
  const [category, setCategory] = useState('picture')
  const [meta, setMeta] = useState({ name: 'Academy Awards', categoryLabel: 'Best Picture', categories: [] })
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [queryFocused, setQueryFocused] = useState(false)
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedMovie, setSelectedMovie] = useState(null)
  // Phones: the year/sort controls fold away behind a "Filters" button.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isMobile = useIsMobile()
  const [movieToLog, setMovieToLog] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    api.get('/movies/awards-meta').then(res => setAwardsMeta(res.data)).catch(() => {})
  }, [])

  // Arriving back here after "Go Back" from a cast/director page —
  // reopen the movie modal we came from.
  useEffect(() => {
    if (location.state?.reopenMovieDetails && !location.state?.backTo) {
      setSelectedMovie(location.state.reopenMovieDetails)
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAwarded(award, category)
  }, [award, category])

  const fetchAwarded = async (awardKey, categoryKey) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/movies/awarded?award=${awardKey}&category=${categoryKey}`)
      setMovies(res.data.movies)
      setMeta({ name: res.data.name, categoryLabel: res.data.categoryLabel, categories: res.data.categories })
    } catch (err) {
      setError('Failed to load award-winning movies')
    } finally {
      setLoading(false)
    }
  }

  const selectAward = (awardKey) => {
    setAward(awardKey)
    setCategory('picture')
  }

  const visibleMovies = useMemo(() => {
    let result = movies

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(m => m.title.toLowerCase().includes(q))
    }
    if (yearFrom) result = result.filter(m => m.year >= Number(yearFrom))
    if (yearTo) result = result.filter(m => m.year <= Number(yearTo))

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest': return (a.year || 0) - (b.year || 0)
        case 'title': return a.title.localeCompare(b.title)
        default: return (b.year || 0) - (a.year || 0)
      }
    })

    return result
  }, [movies, query, yearFrom, yearTo, sort])

  const hasFilters = Boolean(query || yearFrom || yearTo || sort !== 'newest')
  // Count shown on the phone "Filters" button (the search box is always visible).
  const hiddenFilterCount = [yearFrom, yearTo, sort !== 'newest'].filter(Boolean).length
  const clearFilters = () => {
    setQuery('')
    setYearFrom('')
    setYearTo('')
    setSort('newest')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <BackButton onClick={() => navigate('/profile')}>Back to Profile</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '1200px', margin: '0 auto' }}>
        <style>{`
          .award-scroll { scrollbar-width: none; }
          .award-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Hero */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(179,31,47,0.1) 0%, rgba(255,255,255,0.03) 55%)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1rem 1.1rem' : '1.75rem 2.25rem', marginBottom: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 8px 28px rgba(0,0,0,0.35)'
        }}>
          <div style={{
            position: 'absolute', top: '-70px', right: '-70px', width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(179,31,47,0.28) 0%, transparent 70%)', pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative' }}>
            <p style={{ color: '#dc3c4f', fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>
              Hall of Fame
            </p>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' }}><Emoji>🏆</Emoji> Award Winners</h1>
            <p style={{ color: '#999', margin: '0.3rem 0 0 0', fontSize: isMobile ? '0.82rem' : '0.9rem', lineHeight: 1.45 }}>
              {meta.name} {meta.categoryLabel} winners, from classics to the latest ceremony.
            </p>
          </div>
        </div>

        {/* Award shows — phones: one row of three equal segments with short
            names, instead of pills wrapping onto two uneven rows. */}
        <div style={isMobile ? {
          display: 'grid', gridTemplateColumns: `repeat(${Math.max(awardsMeta.length, 1)}, 1fr)`, gap: '0.3rem',
          padding: '0.3rem', marginBottom: '0.75rem',
          backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px'
        } : { display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {awardsMeta.map(show => {
            const isActive = award === show.value
            return (
              <button
                key={show.value}
                onClick={() => selectAward(show.value)}
                aria-pressed={isActive}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.35rem' : '0.5rem',
                  padding: isMobile ? '0.6rem 0.3rem' : '0.6rem 1.1rem', borderRadius: isMobile ? '10px' : '999px',
                  background: isActive ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : (isMobile ? 'transparent' : 'rgba(255,255,255,0.05)'),
                  border: '1px solid ' + (isActive || isMobile ? 'transparent' : 'rgba(255,255,255,0.12)'),
                  color: isActive ? 'white' : '#bbb',
                  cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 0,
                  boxShadow: isActive ? '0 6px 16px rgba(179,31,47,0.4)' : 'none',
                  transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <Emoji>{AWARD_ICONS[show.value] || '🏆'}</Emoji> {isMobile ? (AWARD_SHORT_NAMES[show.value] || show.name) : show.name}
              </button>
            )
          })}
        </div>

        {/* Category tabs — only shown when this award has more than one.
            Phones: a single row you swipe sideways (it was three rows). */}
        {meta.categories.length > 1 && (
          <div
            className={isMobile ? 'award-scroll' : undefined}
            style={isMobile ? {
              display: 'flex', gap: '0.45rem', marginBottom: '1rem',
              overflowX: 'auto', overscrollBehaviorX: 'contain',
              // let the row run to the screen edges while scrolling
              margin: '0 calc(-1 * var(--page-pad)) 1rem', padding: '0 var(--page-pad)',
              maskImage: 'linear-gradient(to right, transparent 0, black 12px, black calc(100% - 24px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 12px, black calc(100% - 24px), transparent 100%)'
            } : { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
          >
            {meta.categories.map(cat => {
              const isActive = category === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  aria-pressed={isActive}
                  style={{
                    padding: isMobile ? '0.45rem 0.85rem' : '0.4rem 0.85rem', borderRadius: '999px', flexShrink: 0, whiteSpace: 'nowrap',
                    backgroundColor: isActive ? 'rgba(179,31,47,0.16)' : 'transparent',
                    border: '1px solid ' + (isActive ? 'rgba(179,31,47,0.5)' : 'rgba(255,255,255,0.12)'),
                    color: isActive ? '#dc3c4f' : '#888',
                    cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                    transition: 'background-color 0.15s, border-color 0.15s, color 0.15s'
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Filters & sort */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '14px' : '16px', padding: isMobile ? '0.65rem' : '1.1rem 1.25rem', marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? '0.5rem' : '1rem', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
            <div style={{ flex: '2 1 220px', minWidth: isMobile ? 0 : '180px' }}>
              {!isMobile && <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>Search title</label>}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: queryFocused ? '#dc3c4f' : '#666', fontSize: '0.8rem', transition: 'color 0.15s', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setQueryFocused(true)}
                  onBlur={() => setQueryFocused(false)}
                  placeholder="Filter by title..."
                  aria-label="Search title"
                  style={{
                    width: '100%', padding: isMobile ? '0.6rem 0.6rem 0.6rem 2.1rem' : '0.5rem 0.6rem 0.5rem 2.1rem', borderRadius: '10px',
                    backgroundColor: '#1a1a1a', border: '1px solid ' + (queryFocused ? '#b31f2f' : 'rgba(255,255,255,0.12)'),
                    boxShadow: queryFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                    color: 'white', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                />
              </div>
            </div>

            {isMobile && (
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem',
                  height: '42px', padding: '0 0.8rem', borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: filtersOpen || hiddenFilterCount ? 'rgba(179,31,47,0.16)' : '#1a1a1a',
                  border: '1px solid ' + (filtersOpen || hiddenFilterCount ? 'rgba(179,31,47,0.5)' : 'rgba(255,255,255,0.12)'),
                  color: filtersOpen || hiddenFilterCount ? '#ff6b7d' : '#ccc', fontSize: '0.8rem', fontWeight: 700
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" />
                  <circle cx="9" cy="7" r="2.2" fill="currentColor" /><circle cx="15" cy="17" r="2.2" fill="currentColor" />
                </svg>
                Filters
                {hiddenFilterCount > 0 && (
                  <span style={{ minWidth: '18px', height: '18px', borderRadius: '999px', backgroundColor: '#b31f2f', color: 'white', fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {hiddenFilterCount}
                  </span>
                )}
              </button>
            )}

            {!isMobile && (
              <>
                <div style={{ flex: '1 1 100px', minWidth: '90px' }}>
                  <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>From</label>
                  <Select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} options={YEAR_OPTIONS} placeholder="Any" />
                </div>
                <div style={{ flex: '1 1 100px', minWidth: '90px' }}>
                  <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>To</label>
                  <Select value={yearTo} onChange={(e) => setYearTo(e.target.value)} options={YEAR_OPTIONS} placeholder="Any" />
                </div>
                <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                  <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>Sort by</label>
                  <Select value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'transparent',
                      color: '#888', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      padding: '0.5rem 0.9rem', borderRadius: '999px', flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#dc3c4f'; e.currentTarget.style.borderColor = 'rgba(179,31,47,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>

          {/* Phones: year range + sort, opened by the Filters button */}
          {isMobile && filtersOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ minWidth: 0 }}>
                <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>From</label>
                <Select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} options={YEAR_OPTIONS} placeholder="Any" />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>To</label>
                <Select value={yearTo} onChange={(e) => setYearTo(e.target.value)} options={YEAR_OPTIONS} placeholder="Any" />
              </div>
              <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>Sort by</label>
                <Select value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    gridColumn: '1 / -1', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'transparent',
                    color: '#bbb', fontSize: '0.8rem', fontWeight: 700
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ color: '#999', fontSize: isMobile ? '0.8rem' : '0.85rem', margin: isMobile ? '0 0 0.75rem 0' : '0 0 1rem 0' }}>
          {loading ? 'Loading...' : `${visibleMovies.length} of ${movies.length} movies`}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', animation: 'pulse 1.4s ease-in-out infinite' }}><Emoji>🏆</Emoji></p>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Loading award winners...</p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: '#dc3c4f', margin: 0 }}>{error}</p>
          </div>
        )}

        {!loading && !error && visibleMovies.length === 0 && (
          <div style={{ textAlign: 'center', padding: isMobile ? '2rem 1rem' : '3rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><Emoji>🏆</Emoji></p>
            <p style={{ color: '#999', margin: 0 }}>No movies match your filters.</p>
          </div>
        )}

        {!loading && !error && visibleMovies.length > 0 && (
          <MovieGrid movies={visibleMovies} onClick={setSelectedMovie} isMobile={isMobile} />
        )}
      </div>

      {selectedMovie && (
        <TMDBMovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onLogMovie={(movie) => {
            setSelectedMovie(null)
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

      <ScrollToTopButton />
    </div>
  )
}

export default AwardedMovies
