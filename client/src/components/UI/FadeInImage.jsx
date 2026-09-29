import { useState } from 'react'

// An <img> that stays transparent until it has actually loaded, then fades
// in — instead of painting in top-to-bottom (or popping in after a fade
// animation that already finished while it was still downloading).
function FadeInImage({ style, duration = 450, ...props }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      {...props}
      // Already in the browser cache: `load` may have fired before React
      // attached the handler, so check `complete` as soon as it mounts.
      ref={el => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true) }}
      onLoad={() => setLoaded(true)}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: `opacity ${duration}ms ease` }}
    />
  )
}

export default FadeInImage
