import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
})

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// Response interceptor - handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const user = JSON.parse(localStorage.getItem('user'))
        if (!user?.refreshToken) {
          throw new Error('No refresh token')
        }

        // Get new access token
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
          { refreshToken: user.refreshToken }
        )

        const newToken = res.data.token

        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, token: newToken }))

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (err) {
        // Refresh failed - logout
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api