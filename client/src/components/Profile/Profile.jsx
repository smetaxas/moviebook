import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SearchModal from '../Movies/SearchModal'

function Profile() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile')
        setUser(res.data)
      } catch (err) {
        setError('Failed to load profile')
      }
    }
    fetchProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (error) return <p>{error}</p>
  if (!user) return <p>Loading...</p>

  return (
    <div>
      <h2>My Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
      <button onClick={() => setShowSearch(true)}>Search Movies</button>
      <button onClick={handleLogout}>Logout</button>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}

export default Profile