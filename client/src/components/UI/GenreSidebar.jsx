import { useState } from 'react'

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

const selectStyle = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  borderRadius: '6px',
  backgroundColor: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'white',
  fontSize: '0.85rem',
  cursor: 'pointer',
  outline: 'none'
}

function GenreSidebar({ genres, selectedGenre, onSelectGenre, yearFrom, yearTo, onYearFromChange, onYearToChange, onClose, isOpen = true }) {
  const [genreQuery, setGenreQuery] = useState('')

  const hasYearFilter = Boolean(yearFrom || yearTo)
  const filteredGenres = genreQuery.trim()
    ? genres.filter(g => g.name.toLowerCase().includes(genreQuery.trim().toLowerCase()))
    : genres

  const clearFilters = () => {
    onYearFromChange('')
    onYearToChange('')
  }

  return (
    <div style={{
      width: isOpen ? '244px' : '0px',
      minWidth: isOpen ? '244px' : '0px',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'sticky', top: '64px',
      height: 'calc(100vh - 64px)',
      transition: isOpen
        ? 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
        : 'width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms, min-width 260ms cubic-bezier(0.4, 0, 0.2, 1) 140ms'
    }}>
      <div style={{
        width: '244px', height: '100%',
        background: 'linear-gradient(180deg, rgba(18,18,18,0.96) 0%, rgba(10,10,10,0.94) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-24px)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: isOpen
          ? 'opacity 220ms ease 80ms, transform 260ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
          : 'opacity 180ms ease, transform 220ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1rem 0.9rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div>
            <p style={{ color: '#e50914', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>
              Discover
            </p>
            <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
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
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ color: '#e50914', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              📅 Year Range
            </p>
            {hasYearFilter && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'none', border: 'none', color: '#777',
                  fontSize: '0.7rem', cursor: 'pointer', padding: 0,
                  textDecoration: 'underline', transition: 'color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                onMouseLeave={e => e.currentTarget.style.color = '#777'}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>From</label>
              <select
                value={yearFrom}
                onChange={(e) => onYearFromChange(e.target.value)}
                style={selectStyle}
              >
                <option value="" style={{ backgroundColor: '#1a1a1a' }}>Any</option>
                {Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#1a1a1a' }}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: '#777', fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>To</label>
              <select
                value={yearTo}
                onChange={(e) => onYearToChange(e.target.value)}
                style={selectStyle}
              >
                <option value="" style={{ backgroundColor: '#1a1a1a' }}>Any</option>
                {Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#1a1a1a' }}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Genres */}
        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: '#e50914', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 1rem', marginBottom: '0.5rem' }}>
            🎬 Genres
          </p>
          <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={genreQuery}
              onChange={(e) => setGenreQuery(e.target.value)}
              placeholder="Filter genres..."
              style={{
                width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px',
                backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#e50914'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>
          {filteredGenres.length === 0 && (
            <p style={{ color: '#555', fontSize: '0.8rem', padding: '0 1rem' }}>No genres match.</p>
          )}
          {filteredGenres.map(genre => {
            const isActive = selectedGenre?.id === genre.id
            return (
              <button
                key={genre.id}
                onClick={() => onSelectGenre(genre)}
                style={{
                  width: '100%', padding: '0.6rem 1rem',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(229,9,20,0.18) 0%, rgba(229,9,20,0.03) 100%)'
                    : 'transparent',
                  color: isActive ? '#ff3b3b' : '#bbb',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #e50914' : '3px solid transparent',
                  boxShadow: isActive ? 'inset 0 0 20px rgba(229,9,20,0.08)' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  transition: 'all 0.15s'
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
    </div>
  )
}

export default GenreSidebar