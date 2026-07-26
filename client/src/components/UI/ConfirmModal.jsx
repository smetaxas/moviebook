function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px',
        width: '90%', maxWidth: '400px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</p>
        <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Remove Movie</h3>
        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem', backgroundColor: '#e50914',
              color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal