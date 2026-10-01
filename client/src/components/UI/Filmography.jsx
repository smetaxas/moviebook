import { useState, useMemo } from 'react'
import { prefetchMovie } from '../../api/movieCache'
import useIsMobile from '../../hooks/useIsMobile'
import MovieDetailsSkeleton from './MovieDetailsSkeleton'
import ScrollRow from './ScrollRow'

// The filmography on an actor's / director's page.
//   sections: [{ label: 'Acting' | 'Directed', movies: [...] }] — first is the
//             role the page was opened as (see PersonDetail).
//   Shows a "Known for" row of their best-known films, tabs when they have
//   both an acting and a directing career, a sort control, and — when
//   sorted by date — decade dividers to break up long careers.

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
]

const today = new Date().toISOString().slice(0, 10)

// A film needs at least this many TMDB ratings to count as "Known for".
const MIN_KNOWN_FOR_VOTES = 100
// …and for an acting role, they must be among the main cast (billing
// position 0-based): a one-line cameo in a blockbuster (Brad Bird's
// "Monorail Announcer" in Jurassic World) isn't what anyone knows them for.
const MAX_KNOWN_FOR_BILLING = 7

// "Tyler Durden" / "Metro Man (voice)" -> { name, voice }
const splitCharacter = (character) => {
  if (!character || character === 'Director') return { name: null, voice: false }
  const voice = /\(voice\)/i.test(character)
  return { name: character.replace(/\s*\((voice|uncredited)\)\s*/gi, ' ').trim(), voice }
}

const styles = `
  .film-card { cursor: pointer; transition: transform 0.2s; -webkit-tap-highlight-color: transparent; }
  .film-card:active { transform: scale(0.97); }
  .film-card .film-poster { transition: box-shadow 0.2s; }
  .film-tabs::-webkit-scrollbar, .film-known::-webkit-scrollbar { display: none; }
  @media (hover: hover) {
    .film-card:hover { transform: translateY(-4px); }
    .film-card:hover .film-poster { box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 0 2px rgba(220,60,79,0.6); }
    .film-sort:hover, .film-tab:hover { transform: none; filter: none; }
  }
  @keyframes filmFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`

function FilmCard({ movie, onOpen, size = 'grid', isMobile }) {
  const { name, voice } = splitCharacter(movie.character)
  const upcoming = movie.release_date && movie.release_date > today
  return (
    <div
      className="film-card"
      onClick={() => onOpen(movie)}
      onMouseEnter={() => prefetchMovie(movie.tmdb_id)}
      style={size === 'known' ? { width: isMobile ? '118px' : '138px', flexShrink: 0 } : undefined}
    >
      <div style={{ position: 'relative' }}>
        <img
          className="film-poster"
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '10px', display: 'block', backgroundColor: '#1a1a1a', boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}
        />
        {upcoming && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            padding: '0.15rem 0.4rem', borderRadius: '6px', fontSize: '0.66rem', fontWeight: 800,
            backgroundColor: 'rgba(179,31,47,0.92)', color: 'white'
          }}>
            Upcoming
          </span>
        )}
      </div>
      <p style={{
        fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 700, lineHeight: 1.25, margin: '0.5rem 0 0.15rem 0',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>{movie.title}</p>
      <p style={{
        fontSize: isMobile ? '0.68rem' : '0.72rem', color: '#8a8a8a', margin: 0, lineHeight: 1.35,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {movie.character === 'Director'
          ? <><span style={{ color: '#c9a3a8' }}>Directed</span>{' · '}</>
          : name && <><span style={{ color: '#c9a3a8' }}>as {name}</span>{' · '}</>}
        {movie.year}
        {voice && (
          <span style={{ marginLeft: '0.35rem', padding: '0 0.3rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.6rem', fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap' }}>VOICE</span>
        )}
      </p>
    </div>
  )
}

function Filmography({ sections, loading, onOpenMovie }) {
  const isMobile = useIsMobile()
  const [activeLabel, setActiveLabel] = useState(null)
  const [sort, setSort] = useState('newest')

  const active = sections.find(s => s.label === activeLabel) || sections[0]
  const total = sections.reduce((n, s) => n + s.movies.length, 0)

  // What they're best known for, across their WHOLE career — not just the
  // open tab: Brad Bird opened as an actor (he voices Edna Mode) must still
  // show Ghost Protocol and The Iron Giant, which he directed. Most votes on
  // TMDB = most watched; a vote floor keeps student films, shorts and ride
  // videos out. A film they both directed and acted in appears once, as
  // "Directed".
  const knownFor = useMemo(() => {
    const byId = new Map()
    for (const section of sections) {
      for (const m of section.movies) {
        const released = !(m.release_date && m.release_date > today)
        if (!released || (m.vote_count || 0) < MIN_KNOWN_FOR_VOTES) continue
        const minorRole = m.character !== 'Director' && typeof m.billing === 'number' && m.billing > MAX_KNOWN_FOR_BILLING
        if (minorRole) continue
        const existing = byId.get(m.tmdb_id)
        if (!existing || m.character === 'Director') byId.set(m.tmdb_id, m)
      }
    }
    const list = [...byId.values()].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 8)
    // Only worth a row when it's a real highlight reel, not most of a short career.
    return list.length >= 4 && total > list.length + 2 ? list : []
  }, [sections, total])

  const sorted = useMemo(() => {
    if (!active) return []
    const list = [...active.movies]
    switch (sort) {
      case 'oldest': return list.sort((a, b) => (a.year || 0) - (b.year || 0))
      case 'popular': return list.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      default: return list.sort((a, b) => (b.year || 0) - (a.year || 0))
    }
  }, [active, sort])

  // Date sorts: split into decades ("2010s") with a divider each.
  const groups = useMemo(() => {
    if (sort !== 'newest' && sort !== 'oldest') return [{ key: 'all', title: null, movies: sorted }]
    const out = []
    for (const m of sorted) {
      const decade = m.year ? `${Math.floor(m.year / 10) * 10}s` : 'Unknown'
      if (!out.length || out[out.length - 1].key !== decade) out.push({ key: decade, title: decade, movies: [] })
      out[out.length - 1].movies.push(m)
    }
    return out
  }, [sorted, sort])

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--poster-min), 1fr))', gap: isMobile ? '1rem 0.6rem' : '1.4rem 1rem' }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: `${isMobile ? '1.75rem' : '2.5rem'} var(--page-pad)` }}>
      <style>{styles}</style>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: isMobile ? '1rem' : '1.25rem' }}>
        <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800, margin: 0 }}>Filmography</h2>
        {!loading && <span style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>{total} {total === 1 ? 'film' : 'films'}</span>}
      </div>

      {loading ? (
        <MovieDetailsSkeleton />
      ) : !active ? (
        <p style={{ color: '#888' }}>No known movies.</p>
      ) : (
        <div style={{ animation: 'filmFadeIn 0.35s ease' }}>
          {/* Known for */}
          {knownFor.length > 0 && (
            <div style={{ marginBottom: isMobile ? '1.75rem' : '2.25rem' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#9a9a9a', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.75rem 0' }}>
                <span style={{ width: '3px', height: '12px', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
                Known for
              </p>
              {/* A bar underneath with a handle to drag (or click the
                  track to jump); touch screens can also just swipe */}
              <ScrollRow
                className="film-known"
                scrollbar
                style={{
                  display: 'flex', gap: isMobile ? '0.65rem' : '0.9rem', overflowX: 'auto', scrollbarWidth: 'none', scrollBehavior: 'smooth',
                  margin: '0 calc(-1 * var(--page-pad))', padding: '0.25rem var(--page-pad) 0.5rem',
                  maskImage: 'linear-gradient(to right, transparent 0, black var(--page-pad), black calc(100% - 28px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0, black var(--page-pad), black calc(100% - 28px), transparent 100%)'
                }}
              >
                {knownFor.map(m => <FilmCard key={m.tmdb_id} movie={m} onOpen={onOpenMovie} size="known" isMobile={isMobile} />)}
              </ScrollRow>
            </div>
          )}

          {/* Controls: section tabs (acting / directing) + sort */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
            marginBottom: isMobile ? '1rem' : '1.25rem', paddingBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            {sections.length > 1 ? (
              <div style={{ display: 'inline-flex', padding: '0.25rem', gap: '0.25rem', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {sections.map(s => {
                  const on = s === active
                  return (
                    <button
                      key={s.label}
                      className="film-tab"
                      onClick={() => setActiveLabel(s.label)}
                      aria-pressed={on}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.45rem',
                        padding: '0.45rem 0.9rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                        background: on ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : 'transparent',
                        color: on ? 'white' : '#aaa', fontSize: '0.85rem', fontWeight: 700,
                        boxShadow: on ? '0 4px 12px rgba(179,31,47,0.35)' : 'none'
                      }}
                    >
                      {s.label}
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: on ? 0.85 : 0.6 }}>{s.movies.length}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#bbb', fontSize: '0.9rem', fontWeight: 700 }}>{active.label}</p>
            )}

            <div className="film-tabs" style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
              {SORTS.map(o => {
                const on = sort === o.value
                return (
                  <button
                    key={o.value}
                    className="film-sort"
                    onClick={() => setSort(o.value)}
                    aria-pressed={on}
                    style={{
                      flexShrink: 0, padding: '0.35rem 0.7rem', borderRadius: '999px', cursor: 'pointer', whiteSpace: 'nowrap',
                      backgroundColor: on ? 'rgba(179,31,47,0.18)' : 'transparent',
                      border: '1px solid ' + (on ? 'rgba(220,60,79,0.55)' : 'rgba(255,255,255,0.12)'),
                      color: on ? '#ff6b7d' : '#999', fontSize: '0.75rem', fontWeight: 700
                    }}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* The films — decade dividers when sorted by date */}
          {groups.map(group => (
            <div key={group.key} style={{ marginBottom: group.title ? (isMobile ? '1.5rem' : '2rem') : 0 }}>
              {group.title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 0.9rem 0' }}>
                  <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#e5e5e5' }}>{group.title}</span>
                  <span style={{ color: '#666', fontSize: '0.75rem', fontWeight: 600 }}>{group.movies.length}</span>
                  <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.12), transparent)' }} />
                </div>
              )}
              <div style={grid}>
                {group.movies.map(m => <FilmCard key={m.tmdb_id} movie={m} onOpen={onOpenMovie} isMobile={isMobile} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Filmography
