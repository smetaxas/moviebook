// The slowly drifting wall of movie posters behind the landing and auth
// pages. One shared component so every page gets the same look, and so it
// always covers the whole screen (enough rows for a tall phone or a big
// monitor) instead of each page hand-rolling 3–4 fixed-height rows.

const POSTER_PATHS = [
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
  '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
  '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  '/9ipbQRgOq6Ilxpwagfa98ikgR9v.jpg',
  '/hfExJPcbBtDeFDEb7I1By72Drlr.jpg',
  '/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg',
  '/8kSerJrhrJWKLk1LViesGcnrUPE.jpg',
  '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  '/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
  '/4m1Au3YkjqsxF8iwQy0fPYSxE0h.jpg',
  '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
  '/vgpXmVaVyUL7GGiDeiK1mKEKzcX.jpg',
  '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
]

// w342 is plenty for a dimmed ~100–150px-wide background tile (w500 was
// ~2x the download for no visible gain).
const POSTERS = POSTER_PATHS.map(p => `https://image.tmdb.org/t/p/w342${p}`)

// Each row starts at a different poster and drifts the opposite way to its
// neighbours, at a slightly different speed, so the wall never lines up.
// Seven rows: enough to cover a 932px-tall phone at the smallest tile size.
const ROWS = [0, 5, 10, 15, 3, 8, 13].map((offset, i) => {
  const rotated = [...POSTERS.slice(offset), ...POSTERS.slice(0, offset)]
  return {
    posters: [...rotated, ...rotated], // doubled: -50% loops seamlessly
    direction: i % 2 === 0 ? 'posterDriftLeft' : 'posterDriftRight',
    duration: 70 + i * 9
  }
})

// overlay: CSS background painted over the posters (a dim, a gradient…).
function PosterBackdrop({ opacity = 0.18, overlay = 'rgba(0,0,0,0.75)' }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes posterDriftLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes posterDriftRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>

      <div style={{
        position: 'absolute', inset: 0, opacity,
        display: 'flex', flexDirection: 'column', gap: '8px',
        // Smaller tiles on phones, so the wall still reads as "lots of
        // movies" rather than two and a half giant posters.
        '--tile-w': 'clamp(96px, 11vw, 150px)'
      }}>
        {ROWS.map((row, r) => (
          <div
            key={r}
            className="poster-drift-row"
            style={{ display: 'flex', width: 'max-content', flexShrink: 0, animation: `${row.direction} ${row.duration}s linear infinite` }}
          >
            {row.posters.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                decoding="async"
                draggable={false}
                // marginRight rather than a flex gap: every tile then carries
                // its own spacing, so the doubled row is exactly twice one set
                // wide and the -50% loop is seamless.
                style={{ width: 'var(--tile-w)', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, marginRight: '8px' }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', inset: 0, background: overlay }} />
    </div>
  )
}

export default PosterBackdrop
