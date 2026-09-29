import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react'

// Where the user last pressed (poster clicked, card tapped…). Recorded
// globally so any modal can grow out of whatever opened it, without every
// poster grid in the app having to pass its position down.
let lastPress = null
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    // Prefer the centre of the poster image that was pressed; fall back to
    // the pointer itself for anything that isn't an image.
    const img = e.target.closest?.('img')
    const r = img?.getBoundingClientRect()
    lastPress = r && r.width > 0
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now() }
      : { x: e.clientX, y: e.clientY, t: Date.now() }
  }, true)
}

// Only a press that just happened opened this modal — ignore stale ones
// (e.g. a modal reopened by navigating back to a page).
const PRESS_MAX_AGE = 1000

const OPEN_MS = 400
const CLOSE_MS = 220

/**
 * Open/close animation for a movie modal: the panel grows out of the poster
 * that was clicked and shrinks back into it on close.
 *
 * Returns:
 *  - panelRef:     attach to the modal panel
 *  - overlayStyle: animation for the dimmed backdrop
 *  - panelStyle:   animation + transform-origin for the panel
 *  - close:        call instead of onClose — plays the exit, then closes
 *  - closing:      true while the exit animation runs
 */
export default function useModalTransition(onClose) {
  const panelRef = useRef(null)
  const [origin, setOrigin] = useState(null) // null until measured
  const [closing, setClosing] = useState(false)
  // Captured once, when the modal mounts.
  const [press] = useState(() => (lastPress && Date.now() - lastPress.t < PRESS_MAX_AGE ? lastPress : null))

  // Measure before the first paint (the panel has no transform yet), so the
  // animation starts from the poster's position relative to the panel.
  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el || !press) { setOrigin('center'); return }
    const r = el.getBoundingClientRect()
    setOrigin(`${press.x - r.left}px ${press.y - r.top}px`)
  }, [press])

  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    timerRef.current = setTimeout(() => onClose?.(), CLOSE_MS)
  }, [closing, onClose])

  const fromPoster = press !== null
  const measured = origin !== null

  const overlayStyle = {
    animation: closing
      ? `movieOverlayOut ${CLOSE_MS}ms ease forwards`
      : `movieOverlayIn ${OPEN_MS * 0.7}ms ease`
  }

  const panelStyle = {
    transformOrigin: origin || 'center',
    // Nothing is painted before the origin is measured (layout effect), so
    // there's no flash of the panel at full size.
    animation: !measured
      ? 'none'
      : closing
        ? `${fromPoster ? 'moviePanelShrink' : 'moviePanelOut'} ${CLOSE_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards`
        : `${fromPoster ? 'moviePanelGrow' : 'moviePanelIn'} ${OPEN_MS}ms cubic-bezier(0.22, 0.9, 0.3, 1)`
  }

  return { panelRef, overlayStyle, panelStyle, close, closing }
}

// Keyframes used above — render once inside the modal.
export const modalTransitionKeyframes = `
  @keyframes movieOverlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes movieOverlayOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes moviePanelGrow {
    from { opacity: 0; transform: scale(0.25); }
    40% { opacity: 1; }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes moviePanelShrink {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.25); }
  }
  @keyframes moviePanelIn {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes moviePanelOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(12px) scale(0.97); }
  }
`
