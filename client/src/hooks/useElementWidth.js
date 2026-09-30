import { useState, useCallback, useEffect } from 'react'

// Tracks an element's own width. For components whose layout should depend
// on the space THEY have, not on the screen: e.g. a card inside a page
// with a collapsible sidebar is much narrower than the viewport suggests.
// Returns [ref, width] — width is null until the element exists.
//
// - `ref` is a callback ref, not a useRef object: the element may not exist
//   on the first render (a page that shows "Loading…" first), and measuring
//   has to start whenever it actually appears.
// - The first measurement is taken synchronously as the element mounts, so
//   the right layout is chosen before anything is painted; ResizeObserver
//   (plus a window resize listener as a belt-and-braces fallback) keeps it
//   up to date afterwards.
// - It's the outer (border-box) width, not the content box: callers
//   typically change their padding per layout, and a padding-dependent
//   measurement would flip-flop between two layouts near a threshold.
export default function useElementWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(null)

  const ref = useCallback((el) => {
    setNode(el)
    if (el) setWidth(el.offsetWidth)
  }, [])

  useEffect(() => {
    if (!node) return
    const measure = () => setWidth(node.offsetWidth)
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [node])

  return [ref, width]
}
