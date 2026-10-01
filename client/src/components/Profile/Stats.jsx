import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import Emoji from '../UI/Emoji'
import useIsMobile from '../../hooks/useIsMobile'

// Every chart here is a single series of counts, so they're all one hue (the
// app's red) — plain HTML bars rather than a canvas library: crisp at any
// size, themed like the rest of the page, and each bar can carry its label.
const BAR = '#dc3c4f'
const TRACK = 'rgba(255,255,255,0.06)'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const styles = `
  @keyframes stFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes stPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
  @keyframes stGrowUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes stGrowRight { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .st-col { -webkit-tap-highlight-color: transparent; }
  .st-col .st-bar { transition: filter 0.15s; }
  .st-col.on .st-bar, .st-col:focus-visible .st-bar { filter: brightness(1.25); }
  .st-col:focus-visible { outline: none; }
  .st-col:focus-visible .st-bar { box-shadow: 0 0 0 2px #fff; }
  .st-more { -webkit-tap-highlight-color: transparent; }
  @media (hover: hover) {
    .st-col:hover .st-bar { filter: brightness(1.25); }
    .st-col:hover, .st-more:hover { transform: none; filter: none; }
    .st-more:hover { color: white !important; }
  }
`

const pulse = 'stPulse 1.3s ease-in-out infinite'
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function Card({ title, insight, children, wide, delay = 0 }) {
  return (
    <section style={{
      gridColumn: wide ? '1 / -1' : undefined, minWidth: 0,
      backgroundColor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px',
      padding: 'clamp(1rem, 3vw, 1.5rem)', animation: `stFadeIn 0.4s ease ${delay}s both`
    }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
      {insight && <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.82rem' }}>{insight}</p>}
      <div style={{ marginTop: '1.1rem' }}>{children}</div>
    </section>
  )
}

const Empty = ({ children }) => (
  <p style={{ color: '#777', fontSize: '0.85rem', margin: 0, padding: '1.5rem 0', textAlign: 'center' }}>{children}</p>
)

// Vertical columns (months, decades). Hover or tap a column for its value;
// the tallest one is labelled outright.
function ColumnChart({ items, height = 180, unit = ['movie', 'movies'] }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...items.map(d => d.value))
  const peak = items.findIndex(d => d.value === max)

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setActive(null)}>
      {/* recessive guides: the top value and the baseline */}
      <div style={{ position: 'relative', height }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1px dashed rgba(255,255,255,0.08)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 'clamp(3px, 1.2vw, 10px)' }}>
          {items.map((d, i) => {
            const on = active === i
            const showValue = on || (i === peak && active === null && d.value > 0)
            return (
              <button
                key={d.label}
                type="button"
                className={'st-col' + (on ? ' on' : '')}
                aria-label={`${d.label}: ${plural(d.value, unit[0], unit[1])}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(on ? null : i)}
                style={{
                  flex: 1, minWidth: 0, height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'default',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative'
                }}
              >
                {showValue && (
                  <span style={{
                    position: 'absolute', bottom: `calc(${(d.value / max) * 100}% + 6px)`, left: '50%', transform: 'translateX(-50%)',
                    padding: on ? '0.2rem 0.45rem' : 0, borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 2,
                    backgroundColor: on ? '#262626' : 'transparent', boxShadow: on ? '0 4px 14px rgba(0,0,0,0.5)' : 'none',
                    border: on ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    color: 'white', fontSize: '0.72rem', fontWeight: 800
                  }}>
                    {on ? `${d.full || d.label} · ${d.value}` : d.value}
                  </span>
                )}
                <span className="st-bar" style={{
                  display: 'block', width: '100%', maxWidth: '44px',
                  height: d.value ? `${(d.value / max) * 100}%` : '3px',
                  minHeight: d.value ? '6px' : undefined,
                  borderRadius: '4px 4px 0 0',
                  backgroundColor: d.value ? BAR : TRACK, opacity: d.muted ? 0.35 : 1,
                  transformOrigin: 'bottom', animation: `stGrowUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.03}s both`
                }} />
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(3px, 1.2vw, 10px)', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.4rem' }}>
        {items.map((d, i) => (
          <span key={d.label} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden',
            color: active === i ? 'white' : d.muted ? '#555' : '#888', fontWeight: active === i ? 700 : 500
          }}>{d.short || d.label}</span>
        ))}
      </div>
    </div>
  )
}

// Horizontal bars with the name and count spelled out — genres, directors,
// ratings. Long lists show the top few with "Show all".
function BarList({ items, limit, labelWidth }) {
  const [expanded, setExpanded] = useState(false)
  const max = Math.max(1, ...items.map(d => d.value))
  const shown = limit && !expanded ? items.slice(0, limit) : items

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {shown.map((d, i) => (
          <div key={d.label} style={{
            display: labelWidth ? 'grid' : 'block', gridTemplateColumns: labelWidth ? `${labelWidth} 1fr` : undefined,
            alignItems: 'center', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: labelWidth ? 0 : '0.35rem', minWidth: 0 }}>
              <span style={{ fontSize: d.stars ? '1rem' : '0.85rem', letterSpacing: d.stars ? '0.08em' : undefined, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
              {!labelWidth && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>{d.value}<span style={{ color: '#777', fontWeight: 600 }}>{d.suffix || ''}</span></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ flex: 1, height: '8px', borderRadius: '4px', backgroundColor: TRACK, overflow: 'hidden' }}>
                <div style={{
                  width: `${(d.value / max) * 100}%`, minWidth: d.value ? '8px' : 0, height: '100%', borderRadius: '4px', backgroundColor: BAR,
                  transformOrigin: 'left', animation: `stGrowRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.05}s both`
                }} />
              </div>
              {labelWidth && <span style={{ width: '2.2rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>{d.value}</span>}
            </div>
          </div>
        ))}
      </div>
      {limit && items.length > limit && (
        <button type="button" className="st-more" onClick={() => setExpanded(!expanded)} style={{
          marginTop: '0.9rem', padding: 0, border: 'none', background: 'none', cursor: 'pointer',
          color: '#ff6b7d', fontSize: '0.8rem', fontWeight: 700
        }}>
          {expanded ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
    </>
  )
}

function Kpi({ icon, value, label, sub }) {
  return (
    <div style={{
      minWidth: 0, padding: 'clamp(0.8rem, 2.5vw, 1.15rem)', borderRadius: '16px',
      backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px',
        backgroundColor: 'rgba(179,31,47,0.15)', border: '1px solid rgba(220,60,79,0.3)', fontSize: '1rem', lineHeight: 1
      }}><Emoji>{icon}</Emoji></span>
      <p style={{ margin: '0.7rem 0 0 0', fontSize: 'clamp(1.45rem, 5vw, 2rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ margin: '0.35rem 0 0 0', color: '#aaa', fontSize: '0.78rem', fontWeight: 600 }}>{label}</p>
      {sub && <p style={{ margin: '0.15rem 0 0 0', color: '#666', fontSize: '0.72rem' }}>{sub}</p>}
    </div>
  )
}

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  useEffect(() => {
    api.get('/watched/stats')
      .then(res => setStats(res.data))
      .catch(() => console.error('Failed to load stats'))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const year = now.getFullYear()

  let body
  if (loading) {
    body = (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {Array.from({ length: 4 }, (_, i) => <div key={i} style={{ height: '130px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.05)', animation: pulse }} />)}
        </div>
        <div style={{ height: '300px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', animation: pulse }} />
      </>
    )
  } else if (!stats || stats.totalMovies === 0) {
    body = (
      <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1rem' : '4.5rem', backgroundColor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px' }}>
        <p style={{ fontSize: '2.6rem', margin: '0 0 0.75rem 0' }}><Emoji>🎬</Emoji></p>
        <p style={{ color: 'white', fontWeight: 700, margin: '0 0 0.3rem 0' }}>No stats yet</p>
        <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>Log a few movies and your stats will show up here.</p>
      </div>
    )
  } else {
    const thisYear = stats.moviesPerMonth.reduce((a, b) => a + b, 0)
    const ratedCount = Object.values(stats.ratingDistribution).reduce((a, b) => a + b, 0)
    const avg = Number(stats.avgRating)

    // Months still ahead this year are drawn dimmed.
    const months = stats.moviesPerMonth.map((value, i) => ({
      label: MONTHS[i].slice(0, 3), short: isMobile ? MONTHS[i][0] : MONTHS[i].slice(0, 3), full: MONTHS[i],
      value, muted: i > now.getMonth()
    }))
    const busiest = stats.moviesPerMonth.indexOf(Math.max(...stats.moviesPerMonth))

    // Every decade from the oldest to the newest, empty ones included, so
    // the axis is a true timeline.
    const decadeYears = Object.keys(stats.moviesPerDecade).map(d => parseInt(d))
    const decades = []
    for (let y = Math.min(...decadeYears); decadeYears.length && y <= Math.max(...decadeYears); y += 10) {
      decades.push({ label: `${y}s`, value: stats.moviesPerDecade[`${y}s`] || 0 })
    }
    if (isMobile && decades.length > 5) decades.forEach(d => { d.short = `'${d.label.slice(2)}` })
    const topDecade = [...decades].sort((a, b) => b.value - a.value)[0]

    const genres = Object.entries(stats.moviesPerGenre).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))
    const ratings = [5, 4, 3, 2, 1].map(s => ({ label: '★'.repeat(s), stars: true, value: stats.ratingDistribution[s] || 0 }))
    const mostGiven = [...ratings].sort((a, b) => b.value - a.value)[0]

    body = (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '0.6rem' : '0.9rem', marginBottom: isMobile ? '0.9rem' : '1.25rem', animation: 'stFadeIn 0.4s ease both' }}>
          <Kpi icon="🎬" value={stats.totalMovies} label="Movies watched" />
          <Kpi icon="⏱" value={`${stats.totalHours}h`} label="Watch time" sub={stats.totalHours >= 24 ? `≈ ${Math.round(stats.totalHours / 24)} days of film` : null} />
          <Kpi icon="⭐" value={ratedCount ? avg.toFixed(1) : '—'} label="Average rating" sub={ratedCount ? `from ${plural(ratedCount, 'rating', 'ratings')}` : 'No ratings yet'} />
          <Kpi icon="📅" value={thisYear} label={`Watched in ${year}`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? '0.9rem' : '1.25rem' }}>
          <Card wide delay={0.05} title={`Your ${year}, month by month`}
            insight={thisYear ? `Busiest month: ${MONTHS[busiest]} with ${plural(stats.moviesPerMonth[busiest], 'movie', 'movies')}` : `Nothing logged in ${year} yet`}>
            <ColumnChart items={months} height={isMobile ? 150 : 200} />
          </Card>

          <Card delay={0.1} title="How you rate"
            insight={ratedCount ? `You give ${mostGiven.label.length} ${mostGiven.label.length === 1 ? 'star' : 'stars'} most often` : null}>
            {ratedCount ? <BarList items={ratings} labelWidth="5.2rem" /> : <Empty>No ratings yet</Empty>}
          </Card>

          <Card delay={0.15} title="Movies by decade"
            insight={topDecade ? `Most of what you watch is from the ${topDecade.label}` : null}>
            {decades.length ? <ColumnChart items={decades} height={isMobile ? 140 : 170} /> : <Empty>No data yet</Empty>}
          </Card>

          <Card delay={0.2} title="Top genres"
            insight={genres.length ? `${genres[0].label} leads with ${plural(genres[0].value, 'movie', 'movies')}` : null}>
            {genres.length ? <BarList items={genres} limit={6} /> : <Empty>No data yet</Empty>}
          </Card>

          <Card delay={0.25} title="Most-watched directors"
            insight={stats.topDirectors.length ? `You keep coming back to ${stats.topDirectors[0].name}` : null}>
            {stats.topDirectors.length
              ? <BarList items={stats.topDirectors.map(d => ({ label: d.name, value: d.count }))} />
              : <Empty>No data yet</Empty>}
          </Card>
        </div>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <style>{styles}</style>
      <Navbar>
        <BackButton onClick={() => navigate('/profile')}>Back to Profile</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '1040px', margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? '1.1rem' : '1.6rem' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: '0 0 0.35rem 0', color: '#dc3c4f', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            <span style={{ width: '3px', height: '0.8rem', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
            Statistics
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 6vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Your movie stats</h1>
          <p style={{ margin: '0.3rem 0 0 0', color: '#999', fontSize: '0.9rem' }}>Everything you've logged on CineLog, in numbers.</p>
        </div>
        {body}
      </div>
    </div>
  )
}

export default Stats
