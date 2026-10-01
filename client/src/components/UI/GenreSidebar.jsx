import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from './Select'
import { genreIcon } from './genreIcons'

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 250

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i)
  .map(year => ({ value: year, label: year }))

// One-tap year ranges for the phone drawer. '' = open-ended.
const currentDecadeStart = currentYear - (currentYear % 10)
const DECADES = [
  { label: `${currentDecadeStart}s`, from: currentDecadeStart, to: '' },
  { label: `${currentDecadeStart - 10}s`, from: currentDecadeStart - 10, to: currentDecadeStart - 1 },
  { label: `${currentDecadeStart - 20}s`, from: currentDecadeStart - 20, to: currentDecadeStart - 11 },
  { label: '90s', from: 1990, to: 1999 },
  { label: '80s', from: 1980, to: 1989 },
  { label: 'Classics', from: '', to: 1979 },
]

const YearSelect = ({ value, onChange }) => (
  <Select value={value} onChange={onChange} options={YEAR_OPTIONS} placeholder="Any" />
)

function GenreSidebar({ genres, selectedGenres = [], onToggleGenre, onClearGenres, yearFrom, yearTo, onYearFromChange, onYearToChange, onYearRangeChange, onClose, isOpen = true, isMobile = false }) {
  const navigate = useNavigate()
  const [genreQuery, setGenreQuery] = useState('')
  const [clearHover, setClearHover] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [handleHover, setHandleHover] = useState(false)
  const wrapperRef = useRef(null)
  // Swipe-to-close on the mobile drawer: how far it's currently dragged
  // left (≤ 0), and where the touch started.
  const [dragX, setDragX] = useState(0)
  const touchRef = useRef(null)

  const hasYearFilter = Boolean(yearFrom || yearTo)
  const filteredGenres = genreQuery.trim()
    ? genres.filter(g => g.name.toLowerCase().includes(genreQuery.trim().toLowerCase()))
    : genres

  // Set both ends of the range together (one update / one fetch) when the
  // parent supports it; otherwise fall back to the two separate callbacks.
  const setYearRange = (from, to) => {
    if (onYearRangeChange) onYearRangeChange(String(from), String(to))
    else { onYearFromChange(String(from)); onYearToChange(String(to)) }
  }
  const clearFilters = () => setYearRange('', '')
  const isDecadeActive = (d) => String(yearFrom || '') === String(d.from) && String(yearTo || '') === String(d.to)

  // Section heading: a quiet grey label with a small red accent (a stack of
  // red emoji headings was the loudest thing in the sidebar).
  const sectionTitle = (text, extraStyle) => (
    <p style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#9a9a9a', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, ...extraStyle }}>
      <span style={{ width: '3px', height: '12px', borderRadius: '2px', backgroundColor: '#dc3c4f' }} />
      {text}
    </p>
  )

  const startResize = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const left = wrapperRef.current?.getBoundingClientRect().left ?? 0
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - left))
      setWidth(next)
    }
    const handleMouseUp = () => setIsResizing(false)

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // While the mobile drawer is open: stop the page behind it from scrolling
  // (otherwise flicking the genre list scrolls the profile underneath once
  // the list hits its end), and let Escape close it.
  const drawerOpen = isMobile && isOpen
  useEffect(() => {
    if (!drawerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, onClose])

  const onTouchStart = (e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY, dragging: false }
  }
  const onTouchMove = (e) => {
    const start = touchRef.current
    if (!start) return
    const t = e.touches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Only take over clearly-horizontal leftward swipes, so vertical
    // scrolling of the genre list keeps working normally.
    if (!start.dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return
      start.dragging = true
    }
    setDragX(Math.min(0, dx))
  }
  const onTouchEnd = () => {
    const wasDragging = touchRef.current?.dragging
    touchRef.current = null
    if (!wasDragging) return
    if (dragX < -70) onClose?.()
    setDragX(0)
  }
  const isDragging = dragX !== 0

  // On mobile the sidebar can't coexist inline with content the way it does
  // on desktop (there's no room, and the resize handle is mouse-only
  // anyway) — it becomes a fixed, full-height drawer that slides in over a
  // dimmed backdrop instead of pushing the layout.
  const drawerWidth = 'min(85vw, 340px)'

  // Desktop hover effects in CSS under (hover: hover), so nothing sticks
  // after a tap on a touchscreen laptop.
  const sidebarStyles = `
    .sb-awards { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
    .sb-awards .sb-chevron { transition: transform 0.15s; }
    .sb-genre { transition: background-color 0.15s, border-color 0.15s, color 0.15s; }
    .sb-genre .sb-icon { transition: transform 0.15s, background-color 0.15s; }
    .sb-decade { transition: background-color 0.15s, border-color 0.15s, color 0.15s; }
    .sb-genre, .sb-mix-chip, .sb-clear { -webkit-tap-highlight-color: transparent; }
    .sb-genre:active { transform: scale(0.97); }
    .sb-filter { transition: border-color 0.15s, box-shadow 0.15s; }
    .sb-filter:focus-within { border-color: rgba(220,60,79,0.7) !important; box-shadow: 0 0 0 3px rgba(179,31,47,0.16); }
    @keyframes sbMixIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
    @media (hover: hover) {
      .sb-awards:hover { transform: none; filter: none; border-color: rgba(255,107,125,0.75) !important; box-shadow: 0 6px 20px rgba(179,31,47,0.3); }
      .sb-awards:hover .sb-chevron { transform: translateX(3px); }
      .sb-genre:hover { transform: none; filter: none; }
      .sb-genre:not([aria-pressed="true"]):hover { background-color: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.12) !important; color: white !important; }
      .sb-genre:hover .sb-icon { transform: scale(1.08); }
      .sb-mix-chip:hover, .sb-clear:hover { transform: none; filter: none; }
      .sb-mix-chip:hover { border-color: rgba(255,107,125,0.7) !important; }
      .sb-clear:hover { color: white !important; }
      .sb-decade:hover { transform: none; filter: none; }
      .sb-decade:not([aria-pressed="true"]):hover { border-color: rgba(255,255,255,0.25) !important; color: white !important; }
    }
  `
  const sectionPad = isMobile ? '0.85rem 1rem' : '1.1rem'
  // Heights below use dvh, not vh: on mobile 100vh includes the area behind
  // the browser's address bar, which would cut off the bottom of the list.

  return (
    <>
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, bottom: 0, zIndex: 140,
            backgroundColor: 'rgba(0,0,0,0.6)',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 220ms ease'
          }}
        />
      )}
      <div
        ref={wrapperRef}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onTouchCancel={isMobile ? onTouchEnd : undefined}
        style={isMobile ? {
        position: 'fixed', top: 'var(--nav-h)', left: 0, zIndex: 141,
        width: drawerWidth, height: 'calc(100dvh - var(--nav-h))',
        transform: isOpen ? `translateX(${dragX}px)` : 'translateX(-100%)',
        transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.4, 0, 0.2, 1)'
      } : {
        width: isOpen ? `${width}px` : '0px',
        minWidth: isOpen ? `${width}px` : '0px',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'sticky', top: 'var(--nav-h)',
        height: 'calc(100dvh - var(--nav-h))',
        transition: isResizing ? 'none' : (isOpen
          ? 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
          : 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms')
      }}>
      <div style={isMobile ? {
        position: 'relative', overflow: 'hidden',
        width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,0.98) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 30px rgba(0,0,0,0.5)'
      } : {
        position: 'relative', overflow: 'hidden',
        width: `${width}px`, height: '100%',
        background: 'linear-gradient(180deg, rgba(18,18,18,0.96) 0%, rgba(10,10,10,0.94) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-24px)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: isOpen
          ? 'opacity 220ms ease 80ms, transform 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
          : 'opacity 180ms ease, transform 220ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{
          position: 'absolute', top: '-90px', left: '-60px', width: '220px', height: '220px',
          background: 'radial-gradient(circle, rgba(179,31,47,0.16) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <style>{sidebarStyles}</style>
        <div style={{
          position: 'relative', height: '100%', overflowY: 'auto', overscrollBehavior: 'contain',
          paddingBottom: isMobile ? `calc(${selectedGenres.length ? '5.5rem' : '1rem'} + env(safe-area-inset-bottom))` : 0,
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0.85rem 1rem 0.75rem' : '1.1rem 1.1rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div>
              <p style={{ color: '#dc3c4f', fontSize: isMobile ? '0.64rem' : '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                Discover
              </p>
              <p style={{ color: 'white', fontSize: '1.05rem', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                Filters & Genres
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close sidebar"
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  lineHeight: 1,
                  flexShrink: 0,
                  transition: 'background-color 0.15s ease, transform 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'scale(1.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Awards — a featured card: it's a destination, not a filter, so it
              shouldn't look like the controls below it */}
          <div style={{ padding: sectionPad, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              className="sb-awards"
              onClick={() => navigate('/awards')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '0.45rem',
                padding: isMobile ? '0.7rem 0.8rem' : '0.55rem 0.6rem', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                background: 'linear-gradient(120deg, rgba(179,31,47,0.32) 0%, rgba(179,31,47,0.08) 70%)',
                border: '1px solid rgba(220,60,79,0.45)', color: 'white'
              }}
            >
              <span style={{
                flexShrink: 0, width: isMobile ? '38px' : '30px', height: isMobile ? '38px' : '30px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1.15rem' : '1.05rem',
                background: 'linear-gradient(135deg, #3a1a1e, #1c1012)', border: '1px solid rgba(255,190,90,0.35)'
              }}>🏆</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: isMobile ? '0.9rem' : '0.86rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Award Winners</span>
                <span style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.66rem', color: '#c9a3a8', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Oscars · Globes · BAFTA</span>
              </span>
              <svg className="sb-chevron" width={isMobile ? 16 : 14} height={isMobile ? 16 : 14} viewBox="0 0 24 24" fill="none" stroke="#ff6b7d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Year Filter */}
          <div style={{ padding: sectionPad, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.65rem' : '0.8rem', minHeight: '22px' }}>
              {sectionTitle('Year Range')}
              {hasYearFilter && (
                <button
                  onClick={clearFilters}
                  onMouseEnter={() => setClearHover(true)}
                  onMouseLeave={() => setClearHover(false)}
                  style={{
                    border: '1px solid ' + (clearHover ? 'rgba(179,31,47,0.5)' : 'rgba(255,255,255,0.12)'),
                    backgroundColor: clearHover ? 'rgba(179,31,47,0.14)' : 'transparent',
                    color: clearHover ? '#dc3c4f' : '#888',
                    fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer',
                    padding: '0.2rem 0.55rem', borderRadius: '999px',
                    transition: 'color 0.15s, background-color 0.15s, border-color 0.15s'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ color: '#777', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>From</label>
                <YearSelect value={yearFrom} onChange={(e) => onYearFromChange(e.target.value)} />
              </div>
              <span style={{ color: '#555', fontSize: '0.85rem', paddingBottom: '0.55rem' }}>—</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ color: '#777', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>To</label>
                <YearSelect value={yearTo} onChange={(e) => onYearToChange(e.target.value)} />
              </div>
            </div>

            {/* One-tap decades — phones: one row you swipe; desktop: they
                wrap to fit however wide the sidebar has been dragged */}
            {(
              <div className="decade-row" style={isMobile ? {
                display: 'flex', gap: '0.4rem', marginTop: '0.7rem', overflowX: 'auto', scrollbarWidth: 'none',
                maskImage: 'linear-gradient(to right, black calc(100% - 20px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 20px), transparent 100%)'
              } : { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.7rem' }}>
                <style>{`.decade-row::-webkit-scrollbar { display: none; }`}</style>
                {DECADES.map(d => {
                  const active = isDecadeActive(d)
                  return (
                    <button
                      key={d.label}
                      className="sb-decade"
                      onClick={() => active ? setYearRange('', '') : setYearRange(d.from, d.to)}
                      aria-pressed={active}
                      style={{
                        flexShrink: 0, padding: isMobile ? '0.4rem 0.75rem' : '0.3rem 0.62rem', borderRadius: '999px', cursor: 'pointer', whiteSpace: 'nowrap',
                        backgroundColor: active ? 'rgba(179,31,47,0.22)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid ' + (active ? 'rgba(220,60,79,0.6)' : 'rgba(255,255,255,0.1)'),
                        color: active ? '#ff6b7d' : '#c8c8c8', fontSize: isMobile ? '0.75rem' : '0.72rem', fontWeight: 700
                      }}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Genres — one tile grid on every screen: two columns in a phone
              drawer or a narrow sidebar, more as the desktop sidebar is
              dragged wider. Picked genres collect in "Your mix" on top. */}
          <div style={{ padding: sectionPad }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '22px' }}>
              {sectionTitle('Genres')}
              {selectedGenres.length > 0 && (
                <span style={{
                  minWidth: '20px', height: '20px', padding: '0 0.4rem', boxSizing: 'border-box', borderRadius: '999px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#b31f2f', color: 'white', fontSize: '0.66rem', fontWeight: 800
                }}>{selectedGenres.length}</span>
              )}
            </div>

            {selectedGenres.length > 0 ? (
              <div style={{
                margin: '0.7rem 0 0.8rem', padding: '0.65rem 0.7rem', borderRadius: '13px',
                background: 'linear-gradient(135deg, rgba(179,31,47,0.18) 0%, rgba(179,31,47,0.06) 100%)',
                border: '1px solid rgba(220,60,79,0.35)', animation: 'sbMixIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#ffb3bb', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your mix</span>
                  <button type="button" className="sb-clear" onClick={onClearGenres} style={{
                    background: 'none', border: 'none', padding: '0.1rem 0.2rem', cursor: 'pointer',
                    color: '#bbb', fontSize: '0.72rem', fontWeight: 700
                  }}>Clear all</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                  {selectedGenres.map((g, i) => (
                    <span key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {i > 0 && <span style={{ color: '#ff6b7d', fontWeight: 800, fontSize: '0.8rem' }}>+</span>}
                      <button type="button" className="sb-mix-chip" onClick={() => onToggleGenre(g)} aria-label={`Remove ${g.name}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.35rem 0.28rem 0.55rem',
                        borderRadius: '999px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(10,10,10,0.55)',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                      }}>
                        {g.name}
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem' }}>✕</span>
                      </button>
                    </span>
                  ))}
                </div>
                <p style={{ color: '#b9a0a3', fontSize: '0.7rem', margin: '0.5rem 0 0' }}>
                  {selectedGenres.length > 1 ? 'Showing movies that are all of these' : 'Add another to narrow it down'}
                </p>
              </div>
            ) : (
              <p style={{ color: '#6f6f6f', fontSize: '0.72rem', margin: '0.3rem 0 0.75rem 0' }}>
                Pick one, or several to combine them
              </p>
            )}

            {/* Desktop: a quick filter (the phone grid fits on one screen anyway) */}
            {!isMobile && (
              <div className="sb-filter" style={{
                position: 'relative', display: 'flex', alignItems: 'center', height: '36px', marginBottom: '0.7rem',
                borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, margin: '0 0.5rem 0 0.65rem', color: '#777' }}>
                  <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <input
                  type="text"
                  value={genreQuery}
                  onChange={(e) => setGenreQuery(e.target.value)}
                  placeholder="Filter genres"
                  aria-label="Filter genres"
                  style={{ flex: 1, minWidth: 0, height: '100%', padding: 0, border: 'none', background: 'transparent', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                />
                {genreQuery && (
                  <button type="button" onClick={() => setGenreQuery('')} aria-label="Clear filter" style={{
                    width: '22px', height: '22px', margin: '0 0.4rem', padding: 0, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.1)', color: '#ccc', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>✕</button>
                )}
              </div>
            )}

            {!isMobile && filteredGenres.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>No genres match “{genreQuery.trim()}”.</p>
            )}

            {/* Fixed row height: every tile is the same size, even the ones
                whose name wraps ("Science Fiction"). */}
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(96px, 1fr))',
              gridAutoRows: isMobile ? '50px' : '68px', gap: '0.4rem'
            }}>
              {(isMobile ? genres : filteredGenres).map(genre => {
                const isActive = selectedGenres.some(g => g.id === genre.id)
                return (
                  <button
                    key={genre.id}
                    type="button"
                    className="sb-genre"
                    onClick={() => onToggleGenre(genre)}
                    aria-pressed={isActive}
                    title={genre.name}
                    style={{
                      // phones: icon beside the name; desktop sidebar: icon above it,
                      // so a narrow column never breaks a name mid-word.
                      position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0,
                      flexDirection: isMobile ? 'row' : 'column', justifyContent: 'center',
                      gap: isMobile ? '0.5rem' : '0.35rem',
                      padding: isMobile ? '0 0.5rem 0 0.4rem' : '0.4rem 0.3rem',
                      borderRadius: '12px', cursor: 'pointer', textAlign: isMobile ? 'left' : 'center',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(179,31,47,0.32) 0%, rgba(179,31,47,0.12) 100%)'
                        : 'rgba(255,255,255,0.035)',
                      border: '1px solid ' + (isActive ? 'rgba(220,60,79,0.7)' : 'rgba(255,255,255,0.07)'),
                      boxShadow: isActive ? '0 4px 14px rgba(179,31,47,0.25)' : 'none',
                      color: isActive ? 'white' : '#cfcfcf',
                      fontSize: '0.78rem', fontWeight: isActive ? 700 : 600, lineHeight: 1.15
                    }}
                  >
                    <span className="sb-icon" style={{
                      flexShrink: 0, width: isMobile ? '32px' : '30px', height: isMobile ? '32px' : '30px', borderRadius: '9px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? 'white' : '#ff6b7d',
                      background: isActive ? 'linear-gradient(135deg, #e0394f, #b31f2f)' : 'rgba(179,31,47,0.12)',
                      border: '1px solid ' + (isActive ? 'transparent' : 'rgba(220,60,79,0.2)')
                    }}>{genreIcon(genre.name)}</span>
                    <span style={{ flex: isMobile ? 1 : 'none', minWidth: 0, maxWidth: '100%', fontSize: isMobile ? undefined : '0.74rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{!isMobile && genre.name === 'Science Fiction' ? 'Sci-Fi' : genre.name}</span>
                    {isActive && (
                      <span aria-hidden="true" style={{
                        position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: '#dc3c4f', border: '2px solid #121212', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Phones: the drawer stays open while you build a combination —
            this closes it to show the results. */}
        {isMobile && selectedGenres.length > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5,
            padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
            background: 'linear-gradient(to top, rgba(10,10,10,1) 65%, rgba(10,10,10,0))'
          }}>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '0.8rem', border: 'none', borderRadius: '12px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #d23046 0%, #b31f2f 100%)', color: 'white',
                fontSize: '0.92rem', fontWeight: 700, boxShadow: '0 6px 18px rgba(179,31,47,0.4)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}
            >
              Show movies · {selectedGenres.map(g => g.name).join(' + ')}
            </button>
          </div>
        )}

        {isOpen && !isMobile && (
          <div
            onMouseDown={startResize}
            onMouseEnter={() => setHandleHover(true)}
            onMouseLeave={() => setHandleHover(false)}
            title="Drag to resize"
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '6px',
              cursor: 'col-resize', zIndex: 10,
              backgroundColor: (isResizing || handleHover) ? 'rgba(179,31,47,0.55)' : 'transparent',
              transition: isResizing ? 'none' : 'background-color 0.15s'
            }}
          />
        )}
      </div>
      </div>
    </>
  )
}

export default GenreSidebar
