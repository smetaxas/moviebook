import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router doesn't reset scroll position on navigation (it's still the
// same document under the hood) — without this, navigating to a new page
// while scrolled down elsewhere lands you mid-scroll on content that isn't
// there yet, which reads as the page being broken/glitchy.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
