import { useState, useRef, useEffect } from 'react'

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 250

const GENRE_ICONS = {
  'Action': '💥',
  'Adventure': '🗺️',
  'Animation': '🎨',
  'Comedy': '😂',
  'Crime': '🔫',
  'Documentary': '🎥',
  'Drama': '🎭',
  'Family': '👨‍👩‍👧',
  'Fantasy': '🧙‍♂️',
  'History': '📜',
  'Horror': '👻',
  'Music': '🎵',
  'Mystery': '🔍',
  'Romance': '❤️',
  'Science Fiction': '🚀',
  'TV Movie': '📺',
  'Thriller': '😱',
  'War': '⚔️',
  'Western': '🤠'
}

const currentYear = new Date().getFullYear()

const CHEVRON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8a8a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`

const YearSelect = ({ value, onChange }) => {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '0.5rem 1.8rem 0.5rem 0.7rem',
        borderRadius: '10px',
        backgroundColor: '#1a1a1a',
        border: '1px solid ' + (focused ? '#b31f2f' : 'rgba(255,255,255,0.12)'),
        boxShadow: focused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
        color: 'white', fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        backgroundImage: `url("${CHEVRON}")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center', backgroundSize: '10px',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
    >
      <option value="" style={{ backgroundColor: '#1a1a1a' }}>Any</option>
      {Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i).map(year => (
        <option key={year} value={year} style={{ backgroundColor: '#1a1a1a' }}>{year}</option>
      ))}
    </select>
  )
}

function GenreSidebar({ genres, selectedGenre, onSelectGenre, yearFrom, yearTo, onYearFromChange, onYearToChange, onClose, isOpen = true }) {
  const [genreQuery, setGenreQuery] = useState('')
  const [genreFilterFocused, setGenreFilterFocused] = useState(false)
  const [clearHover, setClearHover] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [handleHover, setHandleHover] = useState(false)
  const wrapperRef = useRef(null)

  const hasYearFilter = Boolean(yearFrom || yearTo)
  const filteredGenres = genreQuery.trim()
    ? genres.filter(g => g.name.toLowerCase().includes(genreQuery.trim().toLowerCase()))
    : genres

  const clearFilters = () => {
    onYearFromChange('')
    onYearToChange('')
  }

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

  return (
    <div ref={wrapperRef} style={{
      width: isOpen ? `${width}px` : '0px',
      minWidth: isOpen ? `${width}px` : '0px',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'sticky', top: '64px',
      height: 'calc(100vh - 64px)',
      transition: isResizing ? 'none' : (isOpen
        ? 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
        : 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms')
    }}>
      <div style={{
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

        <div style={{ position: 'relative', height: '100%', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.1rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div>
              <p style={{ color: '#dc3c4f', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>
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

          {/* Year Filter */}
          <div style={{ padding: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <p style={{ color: '#dc3c4f', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                📅 Year Range
              </p>
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
          </div>

          {/* Genres */}
          <div style={{ padding: '1.1rem 0' }}>
            <p style={{ color: '#dc3c4f', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 1.1rem', marginBottom: '0.6rem' }}>
              🎬 Genres
            </p>
            <div style={{ padding: '0 1.1rem', marginBottom: '0.6rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.6rem', top: '50%', transform: 'translateY(-50%)', color: genreFilterFocused ? '#dc3c4f' : '#666', fontSize: '0.8rem', transition: 'color 0.15s', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                value={genreQuery}
                onChange={(e) => setGenreQuery(e.target.value)}
                onFocus={() => setGenreFilterFocused(true)}
                onBlur={() => setGenreFilterFocused(false)}
                placeholder="Filter genres..."
                style={{
                  width: '100%', padding: '0.5rem 0.6rem 0.5rem 1.9rem', borderRadius: '10px',
                  backgroundColor: '#1a1a1a', border: '1px solid ' + (genreFilterFocused ? '#b31f2f' : 'rgba(255,255,255,0.12)'),
                  boxShadow: genreFilterFocused ? '0 0 0 3px rgba(179,31,47,0.18)' : 'none',
                  color: 'white', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              />
            </div>
            {filteredGenres.length === 0 && (
              <p style={{ color: '#555', fontSize: '0.8rem', padding: '0 1.1rem' }}>No genres match.</p>
            )}
            {filteredGenres.map(genre => {
              const isActive = selectedGenre?.id === genre.id
              return (
                <button
                  key={genre.id}
                  onClick={() => onSelectGenre(genre)}
                  style={{
                    width: '100%', padding: '0.6rem 1.1rem',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(179,31,47,0.2) 0%, rgba(179,31,47,0.03) 100%)'
                      : 'transparent',
                    color: isActive ? '#dc3c4f' : '#bbb',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #b31f2f' : '3px solid transparent',
                    boxShadow: isActive ? 'inset 0 0 20px rgba(179,31,47,0.08)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: '0.85rem', fontWeight: isActive ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    const icon = e.currentTarget.querySelector('span')
                    if (icon) icon.style.transform = 'scale(1.15)'
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={e => {
                    const icon = e.currentTarget.querySelector('span')
                    if (icon) icon.style.transform = 'scale(1)'
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#bbb'
                    }
                  }}
                >
                  <span style={{ fontSize: '1rem', display: 'inline-block', transition: 'transform 0.15s' }}>{GENRE_ICONS[genre.name] || '🎬'}</span>
                  <span>{genre.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {isOpen && (
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
  )
}

export default GenreSidebar
