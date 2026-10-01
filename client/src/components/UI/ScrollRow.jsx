import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// A horizontally scrolling row with optional controls:
//   scrollbar — a styled bar underneath with a handle you can drag (mouse or
//               touch) or click the track to jump; the handle's size shows
//               how much of the row is visible. Hidden when it all fits.
//   arrows    — ‹ › buttons, only on devices with a real mouse.
//   fade      — the page colour the row fades into at its edges ('#0a0a0a'),
//               drawn as overlays (a CSS mask on the scrolling element itself
//               has to be repainted on every frame of a swipe, which is what
//               made phone scrolling feel heavy).
//
//   bleed     — how far the row reaches past its container on each side
//               (e.g. 'var(--page-pad)' to run to the screen edges); the
//               fades sit at those outer edges
//
//   className / style: for the scrolling element itself
//   arrowTop:          vertical centre of the arrows (default: middle of the row)
//
// Smoothness on phones: the row scrolls natively (momentum, no snapping),
// and nothing re-renders while it moves — the scrollbar handle is moved
// directly, at most once per frame.

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
  .scroll-row-thumb { cursor: grab; transition: background 0.15s; will-change: transform; }
  .scroll-row-track.dragging .scroll-row-thumb { cursor: grabbing; background: linear-gradient(90deg, #ff5a6c, #dc3c4f) !important; }
  .scroll-row-fade { position: absolute; top: 0; bottom: 0; width: 28px; pointer-events: none; z-index: 2; transition: opacity 0.2s; }
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

function ScrollRow({ children, className, style, arrowTop = '50%', arrows = false, scrollbar = false, fade, bleed }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const thumbRef = useRef(null)
  const dragRef = useRef(null)
  const frameRef = useRef(0)
  const mouse = useSyncExternalStore(subscribe, hasMouse)
  // Live geometry — kept in a ref, so scrolling never re-renders anything.
  const geo = useRef({ scrollLeft: 0, maxScroll: 0, thumbWidth: MIN_THUMB, thumbTravel: 1 })
  // Only the on/off states live in React state; they change rarely.
  const [edges, setEdges] = useState({ scrollable: false, canLeft: false, canRight: false })
  const [dragging, setDragging] = useState(false)

  const measure = useCallback(() => {
    frameRef.current = 0
    const el = ref.current
    if (!el) return
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    // The track spans the wrapper; measure that — the track itself is
    // hidden (0 wide) until the row turns out to need scrolling.
    const trackWidth = wrapRef.current?.clientWidth || 0
    const ratio = el.scrollWidth ? el.clientWidth / el.scrollWidth : 1
    const thumbWidth = Math.max(MIN_THUMB, trackWidth * ratio)
    const thumbTravel = Math.max(1, trackWidth - thumbWidth)
    const scrollLeft = el.scrollLeft
    geo.current = { scrollLeft, maxScroll, thumbWidth, thumbTravel }

    const thumb = thumbRef.current
    if (thumb) {
      thumb.style.width = `${thumbWidth}px`
      thumb.style.transform = `translateX(${maxScroll ? (scrollLeft / maxScroll) * thumbTravel : 0}px)`
      trackRef.current?.setAttribute('aria-valuenow', String(maxScroll ? Math.round((scrollLeft / maxScroll) * 100) : 0))
    }

    const next = { scrollable: maxScroll > 4, canLeft: scrollLeft > 4, canRight: scrollLeft < maxScroll - 4 }
    setEdges(prev => (prev.scrollable === next.scrollable && prev.canLeft === next.canLeft && prev.canRight === next.canRight) ? prev : next)
  }, [])

  // at most one measurement per animation frame
  const schedule = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(measure)
  }, [measure])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => {
      el.removeEventListener('scroll', schedule)
      ro.disconnect()
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [measure, schedule, children])

  // the handle's position as of now (for presses on the track)
  const thumbLeftNow = () => {
    const g = geo.current
    return g.maxScroll ? (g.scrollLeft / g.maxScroll) * g.thumbTravel : 0
  }

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
    const g = geo.current
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const left = thumbLeftNow()
    const onHandle = x >= left && x <= left + g.thumbWidth
    if (!onHandle) {
      const target = Math.min(1, Math.max(0, (x - g.thumbWidth / 2) / g.thumbTravel))
      el.scrollLeft = target * g.maxScroll
    }
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft }
    trackRef.current.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onTrackMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const g = geo.current
    ref.current.scrollLeft = d.startScroll + (e.clientX - d.startX) * (g.maxScroll / g.thumbTravel)
  }
  const endDrag = (e) => {
    if (!dragRef.current) return
    dragRef.current = null
    if (trackRef.current.hasPointerCapture?.(e.pointerId)) trackRef.current.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const fadeStyle = (side, show) => ({
    [side]: 0, opacity: show ? 1 : 0,
    background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${fade}, transparent)`
  })

  return (
    <div ref={wrapRef} className="scroll-row-wrap" style={{ position: 'relative' }}>
      <style>{styles}</style>
      <div style={{ position: 'relative', margin: bleed ? `0 calc(-1 * ${bleed})` : undefined }}>
        <div ref={ref} className={className} style={style}>
          {children}
        </div>
        {fade && <div aria-hidden="true" className="scroll-row-fade" style={fadeStyle('left', edges.canLeft)} />}
        {fade && <div aria-hidden="true" className="scroll-row-fade" style={fadeStyle('right', edges.canRight)} />}
      </div>

      {arrows && mouse && edges.canLeft && <Arrow side="left" top={arrowTop} onClick={() => scrollBy(-1)} />}
      {arrows && mouse && edges.canRight && <Arrow side="right" top={arrowTop} onClick={() => scrollBy(1)} />}

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
          style={{
            // Tall invisible hit area around a slim visible rail.
            position: 'relative', height: '18px', marginTop: '0.4rem',
            display: edges.scrollable ? 'flex' : 'none', alignItems: 'center'
          }}
        >
          <div className="scroll-row-rail" style={{ position: 'relative', width: '100%', height: '5px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div
              ref={thumbRef}
              className="scroll-row-thumb"
              style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${MIN_THUMB}px`,
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
