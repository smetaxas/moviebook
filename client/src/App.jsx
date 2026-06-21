import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App