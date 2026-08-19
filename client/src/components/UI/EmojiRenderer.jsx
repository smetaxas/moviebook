import { useEffect } from 'react'
import twemoji from '@twemoji/api'
import { CUSTOM_EMOJI } from './emojiTints'

// Auto-replaces emoji characters anywhere in the app with crisp Twemoji SVGs
// instead of relying on the OS emoji font. Only touches static text nodes;
// content that toggles in place uses <Emoji> directly (see Emoji.jsx) so
// React keeps full ownership of it.
function EmojiRenderer() {
  useEffect(() => {
    const swapCustom = () => {
      Object.entries(CUSTOM_EMOJI).forEach(([char, src]) => {
        document.querySelectorAll(`img.emoji[alt="${char}"]`).forEach(img => {
          if (img.src !== src) img.src = src
        })
      })
    }

    const parse = () => {
      twemoji.parse(document.body, { folder: 'svg', ext: '.svg' })
      swapCustom()
    }
    parse()

    let scheduled = false
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        parse()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => observer.disconnect()
  }, [])

  return null
}

export default EmojiRenderer
