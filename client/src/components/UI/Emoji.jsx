import twemoji from '@twemoji/api'
import { CUSTOM_EMOJI } from './emojiTints'

function Emoji({ children, style }) {
  const customSrc = CUSTOM_EMOJI[children]
  if (customSrc) {
    return <img className="emoji" src={customSrc} alt={children} style={style} />
  }

  return (
    <span
      style={style}
      dangerouslySetInnerHTML={{ __html: twemoji.parse(children, { folder: 'svg', ext: '.svg' }) }}
    />
  )
}

export default Emoji
