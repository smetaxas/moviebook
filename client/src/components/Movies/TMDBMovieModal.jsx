import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Emoji from '../UI/Emoji'

function TMDBMovieModal({ movie, onClose, onLogMovie, hideLog, onWatchlistChange }) {
  const [tmdbMovie, setTmdbMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistId, setWatchlistId] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlistHover, setWatchlistHover] = useState(false)
  const [trailerHover, setTrailerHover] = useState(false)
  const [whereHover, setWhereHover] = useState(false)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [tmdbRes, watchlistRes] = await Promise.all([
          api.get(`/movies/tmdb/${movie.tmdb_id}`),
          api.get(`/watchlist/check/${movie.tmdb_id}`)
        ])
        setTmdbMovie(tmdbRes.data)
        setInWatchlist(watchlistRes.data.inWatchlist)
        setWatchlistId(watchlistRes.data.id)
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [])

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

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const imdbScore = tmdbMovie?.ratings?.imdb ? parseFloat(tmdbMovie.ratings.imdb) : null
  const rtScore = tmdbMovie?.ratings?.rotten_tomatoes ? parseInt(tmdbMovie.ratings.rotten_tomatoes, 10) : null
  const metaScore = tmdbMovie?.ratings?.metacritic ? parseInt(tmdbMovie.ratings.metacritic, 10) : null
  const metaColor = metaScore == null ? '#888' : metaScore >= 61 ? '#6c3' : metaScore >= 40 ? '#fc3' : '#f33'

  const metaLine = tmdbMovie
    ? [tmdbMovie.director, tmdbMovie.genres?.join(', '), tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : null, formatDate(tmdbMovie.release_date)]
        .filter(Boolean)
    : []

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', borderRadius: '12px',
        width: '100%', maxWidth: '900px',
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        <button
          onClick={onClose}
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

        {loading && <p style={{ color: 'white', padding: '2rem' }}>Loading...</p>}
        {error && <p style={{ color: '#b31f2f', padding: '2rem' }}>{error}</p>}

        {tmdbMovie && (
          <>
            {/* Backdrop */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
              {tmdbMovie.backdrop_url && (
                <img
                  src={tmdbMovie.backdrop_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.75) 65%, #1a1a1a 100%)'
              }} />
            </div>

            {/* Poster + title, overlapping the backdrop */}
            <div style={{ display: 'flex', gap: '1.5rem', padding: '0 2rem', marginTop: '-130px', position: 'relative', zIndex: 2 }}>
              {tmdbMovie.poster_url && (
                <img
                  src={tmdbMovie.poster_url}
                  alt={tmdbMovie.title}
                  style={{ width: '160px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}
                />
              )}
              <div style={{ flex: 1, paddingTop: '132px', minWidth: 0 }}>
                <h2 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: '800' }}>
                  {tmdbMovie.title} <span style={{ color: '#aaa', fontWeight: '400' }}>({tmdbMovie.year})</span>
                </h2>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                  {metaLine.join('  ·  ')}
                </p>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
              {/* Ratings */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <a
                  href={tmdbMovie.imdb_id ? `https://www.imdb.com/title/${tmdbMovie.imdb_id}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.7rem',
                    backgroundColor: imdbScore != null ? 'rgba(245,197,24,0.12)' : 'transparent',
                    border: '1px solid rgba(245,197,24,0.45)',
                    borderRadius: '6px', color: '#f5c518', textDecoration: 'none',
                    fontWeight: '700', fontSize: '0.85rem'
                  }}
                >
                  <span style={{ backgroundColor: '#f5c518', color: '#000', borderRadius: '3px', padding: '0 4px', fontSize: '0.7rem' }}>IMDb</span>
                  {imdbScore != null ? `${imdbScore.toFixed(1)}/10` : 'N/A'}
                </a>
                <a
                  href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(tmdbMovie.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.7rem',
                    backgroundColor: rtScore == null ? 'transparent' : (rtScore >= 60 ? 'rgba(250,50,10,0.12)' : 'rgba(112,168,80,0.12)'),
                    border: '1px solid ' + (rtScore == null ? 'rgba(255,255,255,0.15)' : (rtScore >= 60 ? 'rgba(250,50,10,0.45)' : 'rgba(112,168,80,0.45)')),
                    borderRadius: '6px', color: rtScore == null ? '#888' : (rtScore >= 60 ? '#fa320a' : '#70a850'),
                    textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem'
                  }}
                >
                  <Emoji>{rtScore == null ? '🍅' : (rtScore >= 60 ? '🍅' : '🤢')}</Emoji> {rtScore != null ? `${rtScore}%` : 'N/A'}
                </a>
                <a
                  href={`https://www.metacritic.com/search/${encodeURIComponent(tmdbMovie.title)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.7rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px', color: '#ddd', textDecoration: 'none',
                    fontWeight: '700', fontSize: '0.85rem'
                  }}
                >
                  <span style={{ backgroundColor: metaColor, color: '#000', borderRadius: '3px', padding: '0 5px', fontSize: '0.75rem', fontWeight: '800' }}>
                    {metaScore != null ? metaScore : '–'}
                  </span>
                  Metacritic
                </a>
              </div>

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
                    {tmdbMovie.cast.map((member, i) => (
                      <div key={i} style={{ flexShrink: 0, width: '76px', textAlign: 'center' }}>
                        {member.profile_url ? (
                          <img
                            src={member.profile_url}
                            alt={member.name}
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.4rem' }}
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
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!hideLog && (
                  <button
                    onClick={() => onLogMovie(movie)}
                    style={{ padding: '0.6rem 1.25rem', backgroundColor: '#b31f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
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
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    backgroundColor: inWatchlist
                      ? (watchlistHover ? 'rgba(179,31,47,0.15)' : 'rgba(0,200,0,0.15)')
                      : 'rgba(255,255,255,0.08)',
                    color: inWatchlist ? (watchlistHover ? '#b31f2f' : '#00c800') : 'white',
                    border: '1px solid ' + (inWatchlist ? (watchlistHover ? '#b31f2f' : '#00c800') : 'rgba(255,255,255,0.2)'),
                    borderRadius: '4px', cursor: watchlistLoading ? 'default' : 'pointer', fontWeight: '600',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s'
                  }}
                >
                  {watchlistLoading
                    ? '...'
                    : inWatchlist
                      ? <Emoji>{watchlistHover ? '🗑 Remove' : '✓ In Watchlist'}</Emoji>
                      : '+ Watchlist'}
                </button>
                {tmdbMovie.trailer_key && (
                  <a
                    href={'https://www.youtube.com/watch?v=' + tmdbMovie.trailer_key}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setTrailerHover(true)}
                    onMouseLeave={() => setTrailerHover(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 1.25rem 0.6rem 1rem',
                      backgroundColor: trailerHover ? '#b31f2f' : 'rgba(179,31,47,0.12)',
                      border: '1px solid ' + (trailerHover ? '#b31f2f' : 'rgba(179,31,47,0.5)'),
                      borderRadius: '6px', color: 'white', textDecoration: 'none', fontWeight: '600',
                      boxShadow: trailerHover ? '0 4px 14px rgba(179,31,47,0.4)' : 'none',
                      transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: trailerHover ? 'white' : '#b31f2f',
                      color: trailerHover ? '#b31f2f' : 'white',
                      fontSize: '0.6rem', flexShrink: 0
                    }}>
                      ▶
                    </span>
                    Watch Trailer
                  </a>
                )}
                <a
                  href={'https://www.google.com/search?q=where+to+watch+' + encodeURIComponent(tmdbMovie.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setWhereHover(true)}
                  onMouseLeave={() => setWhereHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                    padding: '0.6rem 1.25rem',
                    backgroundColor: whereHover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (whereHover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'),
                    borderRadius: '6px', color: 'white', textDecoration: 'none', fontWeight: '600',
                    transition: 'background-color 0.15s, border-color 0.15s'
                  }}
                >
                  📺 Where to Watch
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TMDBMovieModal
