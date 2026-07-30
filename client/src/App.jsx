import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import Profile from './components/Profile/Profile'
import WatchedMoviesPage from './components/Profile/WatchedMoviesPage'
import CommunityFeed from './components/Feed/CommunityFeed'
import UserProfile from './components/Profile/UserProfile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/watched" element={<WatchedMoviesPage />} />
        <Route path="/feed" element={<CommunityFeed />} />
        <Route path="/user/:userId" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App