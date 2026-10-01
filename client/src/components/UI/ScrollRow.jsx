import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// A horizontally scrolling row with optional controls:
//   scrollbar — a styled bar underneath with a handle you can drag (mouse or
//               touch) or click the track to jump; the handle's size shows
//               how much of the row is visible. Hidden when it all fits.
//   arrows    — ‹ › buttons, only on devices with a real mouse.
//
//   className / style: for the scrolling element itself
//   arrowTop:          vertical centre of the arrows (default: middle of the row)

const pointerQuery = '(hover: hover) and (pointer: fine)'
const subscribe = (cb) => {
  const mql = window.matchMedia(pointerQuery)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const hasMouse = () => window.matchMedia(pointerQuery).matches

const MIN_THUMB = 40 // px — never so small it's hard to grab

const styles = `
  .scroll-row-wrap .scroll-row-arrow { opacity: 0; transition: opacity 0.18s, background-color 0.15s, border-color 0.15s; }
  .scroll-row-wrap:hover .scroll-row-arrow { opacity: 1; }
  .scroll-row-arrow:focus-visible { opacity: 1; outline: 2px solid #dc3c4f; outline-offset: 2px; }
  .scroll-row-arrow:hover { background-color: #b31f2f !important; border-color: #dc3c4f !important; filter: none; }

  .scroll-row-track { cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .scroll-row-track .scroll-row-rail { transition: height 0.15s; }
  .scroll-row-track:hover .scroll-row-rail, .scroll-row-track.dragging .scroll-row-rail { height: 8px !important; }
  .scroll-row-thumb { cursor: grab; transition: background 0.15s; }
  .scroll-row-track.dragging .scroll-row-thumb { cursor: grabbing; background: linear-gradient(90deg, #ff5a6c, #dc3c4f) !important; }
`

function Arrow({ side, onClick, top }) {
  return (
    <button
      type="button"
      className="scroll-row-arrow"
      onClick={onClick}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      style={{
        position: 'absolute', top, [side]: '-6px', transform: 'translateY(-50%)', zIndex: 3,
        width: '40px', height: '40px', borderRadius: '50%', padding: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(15,15,15,0.88)', border: '1px solid rgba(255,255,255,0.18)', color: 'white',
        boxShadow: '0 6px 20px rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}

function ScrollRow({ children, className, style, arrowTop = '50%', arrows = false, scrollbar = false }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const dragRef = useRef(null)
  const mouse = useSyncExternalStore(subscribe, hasMouse)
  const [m, setM] = useState({ scrollLeft: 0, maxScroll: 0, visibleRatio: 1, trackWidth: 0 })
  const [dragging, setDragging] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setM({
      scrollLeft: el.scrollLeft,
      maxScroll: Math.max(0, el.scrollWidth - el.clientWidth),
      visibleRatio: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
      // The track spans the wrapper; measure that — the track itself is
      // hidden (0 wide) until the row turns out to need scrolling.
      trackWidth: wrapRef.current?.clientWidth || 0
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [update, children])

  const scrollable = m.maxScroll > 4
  const canLeft = m.scrollLeft > 4
  const canRight = m.scrollLeft < m.maxScroll - 4

  // Handle geometry, in px along the track
  const thumbWidth = Math.max(MIN_THUMB, m.trackWidth * m.visibleRatio)
  const thumbTravel = Math.max(1, m.trackWidth - thumbWidth)
  const thumbLeft = m.maxScroll ? (m.scrollLeft / m.maxScroll) * thumbTravel : 0

  const scrollBy = (dir) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  // --- dragging (pointer events: mouse, touch and pen alike) ---
  // Pressing ANYWHERE on the bar's tall hit area starts a drag — the
  // visible handle is only a few px tall, and a press just beside it
  // shouldn't do something different. On the handle it drags from where
  // it is; elsewhere the handle first jumps under the pointer.
  const onTrackDown = (e) => {
    e.preventDefault()
    const el = ref.current
    // Follow the pointer exactly while dragging (no smooth-scroll lag).
    el.style.scrollBehavior = 'auto'
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const onHandle = x >= thumbLeft && x <= thumbLeft + thumbWidth
    if (!onHandle) {
      const target = Math.min(1, Math.max(0, (x - thumbWidth / 2) / thumbTravel))
      el.scrollLeft = target * m.maxScroll
    }
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft }
    trackRef.current.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onTrackMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const el = ref.current
    el.scrollLeft = d.startScroll + (e.clientX - d.startX) * (m.maxScroll / thumbTravel)
  }
  const endDrag = (e) => {
    if (!dragRef.current) return
    dragRef.current = null
    ref.current.style.scrollBehavior = ''
    if (trackRef.current.hasPointerCapture?.(e.pointerId)) trackRef.current.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <div ref={wrapRef} className="scroll-row-wrap" style={{ position: 'relative' }}>
      {(arrows || scrollbar) && <style>{styles}</style>}
      <div ref={ref} className={className} style={style}>
        {children}
      </div>

      {arrows && mouse && canLeft && <Arrow side="left" top={arrowTop} onClick={() => scrollBy(-1)} />}
      {arrows && mouse && canRight && <Arrow side="right" top={arrowTop} onClick={() => scrollBy(1)} />}

      {scrollbar && (
        <div
          ref={trackRef}
          className={'scroll-row-track' + (dragging ? ' dragging' : '')}
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="scrollbar"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={m.maxScroll ? Math.round((m.scrollLeft / m.maxScroll) * 100) : 0}
          style={{
            // Tall invisible hit area around a slim visible rail.
            position: 'relative', height: '18px', marginTop: '0.4rem',
            display: scrollable ? 'flex' : 'none', alignItems: 'center'
          }}
        >
          <div className="scroll-row-rail" style={{ position: 'relative', width: '100%', height: '5px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div
              className="scroll-row-thumb"
              style={{
                position: 'absolute', top: 0, bottom: 0, left: `${thumbLeft}px`, width: `${thumbWidth}px`,
                borderRadius: '999px', background: 'linear-gradient(90deg, #dc3c4f, #b31f2f)',
                boxShadow: '0 0 10px rgba(179,31,47,0.45)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ScrollRow
