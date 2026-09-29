import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { fetchPerson, getCachedPerson } from '../../api/personCache'
import { prefetchMovie } from '../../api/movieCache'
import { resumeAfter } from '../../utils/navState'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
import ScrollToTopButton from '../UI/ScrollToTopButton'
import MovieDetailsSkeleton from '../UI/MovieDetailsSkeleton'
import TMDBMovieModal from './TMDBMovieModal'
import LogMovieModal from './LogMovieModal'

const BIO_PREVIEW_LENGTH = 420

function PersonDetail() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Which credit list counts as "participated in" — director's crew credits
  // vs an actor's cast credits — set by whichever photo/name was clicked.
  const role = searchParams.get('role')
  const [person, setPerson] = useState(() => getCachedPerson(personId, role))
  const [error, setError] = useState('')
  const [bioExpanded, setBioExpanded] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieToLog, setMovieToLog] = useState(null)

  // Whatever the caller already knew (from the cast/director photo we just
  // clicked) — renders the hero instantly instead of waiting on our own fetch.
  const initialPerson = location.state?.initialPerson

  // Same "go back and reopen" contract used by UserProfile: if we arrived
  // here from a movie's details, forward that reopen instruction back to
  // whichever page we came from instead of just popping history.
  const goBack = () => {
    const { backTo, ...reopenState } = location.state || {}
    if (backTo) {
      navigate(backTo, { state: reopenState })
    } else {
      navigate(-1)
    }
  }

  useEffect(() => {
    setBioExpanded(false)
    setError('')
    // Reset synchronously to this id's cached value (or null) rather than
    // leaving the previous person's data on screen while the new one loads —
    // navigating between two person pages reuses this component instance.
    const cached = getCachedPerson(personId, role)
    setPerson(cached)
    if (!cached) {
      fetchPerson(personId, role)
        .then(setPerson)
        .catch(() => setError('Could not load this person.'))
    }
  }, [personId, role])

  // Arriving here from a movie's details (e.g. clicked a co-star while
  // already viewing a person page) — reopen that movie's modal. Keyed on
  // personId, not just mount, since navigating between two person pages
  // reuses this same component instance rather than remounting it.
  useEffect(() => {
    if (location.state?.reopenMovieDetails && !location.state?.backTo) {
      setSelectedMovie(location.state.reopenMovieDetails)
      navigate(location.pathname, { replace: true, state: resumeAfter(location) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const age = (birthday, deathday) => {
    if (!birthday) return null
    const end = deathday ? new Date(deathday) : new Date()
    const start = new Date(birthday)
    let years = end.getFullYear() - start.getFullYear()
    const beforeBirthday = end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
    if (beforeBirthday) years--
    return years
  }

  const showFullBio = bioExpanded || !person || person.biography.length <= BIO_PREVIEW_LENGTH
  const bioText = person
    ? (showFullBio ? person.biography : person.biography.slice(0, BIO_PREVIEW_LENGTH).trim() + '…')
    : ''

  // Renders the hero immediately from whatever the cast/director photo we
  // clicked already told us, same pattern as the movie modals — only the
  // bio and filmography (which need our own fetch) show a skeleton.
  const display = person || initialPerson || {}

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <style>{`@keyframes personContentFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <Navbar>
        <NavButton onClick={goBack}>
          ← Back
        </NavButton>
      </Navbar>

      {error && <p style={{ color: '#dc3c4f', textAlign: 'center', marginTop: '3rem' }}>{error}</p>}

      {!error && display.name && (
        <>
          {/* Hero */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: 'clamp(1.5rem, 6vw, 3rem) var(--page-pad)'
          }}>
            <div style={{
              position: 'absolute', top: '-140px', left: '-100px', width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(179,31,47,0.3) 0%, transparent 70%)', pointerEvents: 'none'
            }} />

            <div style={{
              position: 'relative', maxWidth: '1000px', margin: '0 auto',
              display: 'flex', gap: 'clamp(1.25rem, 5vw, 2.5rem)', alignItems: 'flex-start', flexWrap: 'wrap'
            }}>
              {display.profile_url ? (
                <img
                  src={display.profile_url}
                  alt={display.name}
                  style={{
                    width: 'clamp(120px, 35vw, 180px)', height: 'clamp(120px, 35vw, 180px)', borderRadius: '50%', objectFit: 'cover',
                    border: '3px solid rgba(179,31,47,0.6)', boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 6px rgba(179,31,47,0.08)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: 'clamp(120px, 35vw, 180px)', height: 'clamp(120px, 35vw, 180px)', borderRadius: '50%', backgroundColor: '#1e1e1e',
                  border: '3px solid rgba(179,31,47,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', fontWeight: 800, color: '#666', flexShrink: 0
                }}>
                  {display.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 'min(260px, 100%)', paddingTop: '0.5rem' }}>
                {person?.known_for_department && (
                  <span style={{
                    display: 'inline-block', padding: '0.3rem 0.8rem', marginBottom: '0.8rem',
                    backgroundColor: 'rgba(179,31,47,0.15)', border: '1px solid rgba(179,31,47,0.4)',
                    borderRadius: '999px', color: '#dc3c4f', fontSize: '0.7rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>
                    {person.known_for_department}
                  </span>
                )}
                <h1 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {display.name}
                </h1>

                {!person ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '420px' }}>
                    <style>{`@keyframes personSkeletonPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
                    {['100%', '94%', '65%'].map((w, i) => (
                      <div key={i} style={{ width: w, height: '0.9rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.07)', animation: 'personSkeletonPulse 1.3s ease-in-out infinite' }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ animation: 'personContentFadeIn 0.35s ease' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
                      {person.birthday && (
                        <div>
                          <p style={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem 0' }}>
                            Born
                          </p>
                          <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>
                            {formatDate(person.birthday)} <span style={{ color: '#888' }}>({age(person.birthday, person.deathday)}{person.deathday ? '' : ' years old'})</span>
                          </p>
                        </div>
                      )}
                      {person.deathday && (
                        <div>
                          <p style={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem 0' }}>
                            Died
                          </p>
                          <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>{formatDate(person.deathday)}</p>
                        </div>
                      )}
                      {person.place_of_birth && (
                        <div>
                          <p style={{ color: '#666', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem 0' }}>
                            Birthplace
                          </p>
                          <p style={{ color: 'white', fontSize: '0.9rem', margin: 0 }}>{person.place_of_birth}</p>
                        </div>
                      )}
                    </div>

                    {person.biography && (
                      <div>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.65', margin: 0, whiteSpace: 'pre-line' }}>
                          {bioText}
                        </p>
                        {person.biography.length > BIO_PREVIEW_LENGTH && (
                          <button
                            onClick={() => setBioExpanded(v => !v)}
                            style={{
                              background: 'none', border: 'none', color: '#dc3c4f', fontWeight: 700,
                              fontSize: '0.82rem', cursor: 'pointer', padding: '0.5rem 0 0 0'
                            }}
                          >
                            {bioExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filmography */}
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem var(--page-pad)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              🎬 Filmography {person && <span style={{ color: '#666', fontWeight: 500, fontSize: '1rem' }}>({person.movies.length})</span>}
            </h2>

            {!person ? (
              <MovieDetailsSkeleton />
            ) : person.movies.length === 0 ? (
              <p style={{ color: '#888' }}>No known movies.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--poster-min), 1fr))', gap: '1.25rem', animation: 'personContentFadeIn 0.35s ease' }}>
                {person.movies.map((movie) => (
                  <div
                    key={movie.tmdb_id}
                    onClick={() => setSelectedMovie(movie)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; prefetchMovie(movie.tmdb_id) }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      style={{ width: '100%', borderRadius: '8px', display: 'block', boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}
                    />
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.15rem', fontWeight: 600 }}>{movie.title}</p>
                    <p style={{ fontSize: '0.72rem', color: '#888', margin: 0 }}>
                      {movie.character ? movie.character : movie.year} {movie.character && movie.year ? `· ${movie.year}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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

export default PersonDetail
