import { useNavigate } from 'react-router-dom'

function Navbar({ leftExtra, children }) {
  const navigate = useNavigate()

  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(179,31,47,0.3)',
      padding: '0 2rem', height: '84px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative', gap: '0.5rem' }}>
        <img
          src="/logo.png" alt="CineLog"
          onClick={() => navigate('/profile')}
          style={{ height: '60px', objectFit: 'contain', cursor: 'pointer' }}
        />
        {leftExtra}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  )
}

export default Navbar
