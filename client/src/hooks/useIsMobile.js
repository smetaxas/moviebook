import { useSyncExternalStore } from 'react'

// The one mobile breakpoint for the whole app. Anything narrower than this
// gets the phone layout (drawer sidebar, hamburger menu, tighter spacing).
export const MOBILE_BREAKPOINT = 768

// Range syntax rather than max-width: ${MOBILE_BREAKPOINT - 1}px — with
// fractional display scaling the viewport can be e.g. 767.2px wide, which
// falls in the gap between 767 and 768 and would match neither layout.
const query = `(width < ${MOBILE_BREAKPOINT}px)`

// matchMedia only notifies when the breakpoint is actually crossed (a plain
// resize listener fires on every pixel of a drag), and it also covers
// orientation changes on phones.
const subscribe = (onChange) => {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(query).matches

export default function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
