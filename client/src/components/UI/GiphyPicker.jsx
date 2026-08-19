import { useState, useEffect } from 'react'
import { GiphyFetch } from '@giphy/js-fetch-api'

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY)

function GiphyPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const timer = setTimeout(() => {
      const request = query.trim()
        ? gf.search(query.trim(), { limit: 20 })
        : gf.trending({ limit: 20 })

      request
        .then(({ data }) => { if (!cancelled) setGifs(data) })
        .catch(() => { if (!cancelled) setError('Failed to load GIFs') })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0,
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px', padding: '1rem',
      width: '320px', zIndex: 1000,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ color: 'white', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>GIF</p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem' }}>x</button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search GIFs..."
        autoFocus
        style={{
          width: '100%', padding: '0.5rem', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: 'white', marginBottom: '0.75rem',
          boxSizing: 'border-box', outline: 'none'
        }}
      />

      <div style={{ height: '250px', overflowY: 'auto' }}>
        {loading && <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>Loading...</p>}
        {!loading && error && <p style={{ color: '#dc3c4f', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>{error}</p>}
        {!loading && !error && gifs.length === 0 && (
          <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>No GIFs found</p>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {gifs.map(gif => (
              <img
                key={gif.id}
                src={gif.images.fixed_width_small.url}
                alt={gif.title || 'GIF'}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                style={{ width: '100%', borderRadius: '6px', cursor: 'pointer', display: 'block' }}
              />
            ))}
          </div>
        )}
      </div>

      <p style={{ color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '0.5rem' }}>
        Powered by GIPHY
      </p>
    </div>
  )
}

export default GiphyPicker
