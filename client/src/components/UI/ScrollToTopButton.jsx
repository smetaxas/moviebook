import { useState, useEffect } from 'react'

function ScrollToTopButton({ threshold = 400 }) {
  const [visible, setVisible] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Scroll to top"
      title="Back to top"
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 150,
        width: '50px', height: '50px', borderRadius: '50%', padding: 0,
        background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hover
          ? '0 10px 28px rgba(179,31,47,0.55)'
          : '0 6px 18px rgba(179,31,47,0.35)',
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hover ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)')
          : 'translateY(20px) scale(0.8)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ transition: 'transform 0.25s ease', transform: hover ? 'translateY(-2px)' : 'translateY(0)' }}>
        <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default ScrollToTopButton
