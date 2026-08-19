import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import Profile from './components/Profile/Profile'
import WatchedMoviesPage from './components/Profile/WatchedMoviesPage'
import CommunityFeed from './components/Feed/CommunityFeed'
import UserProfile from './components/Profile/UserProfile'
import VerifyEmail from './components/Auth/VerifyEmail'
import Landing from './components/Landing'
import NotFound from './components/NotFound'
import EmojiRenderer from './components/UI/EmojiRenderer'

function App() {
  return (
    <BrowserRouter>
      <EmojiRenderer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/watched" element={<WatchedMoviesPage />} />
        <Route path="/feed" element={<CommunityFeed />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App