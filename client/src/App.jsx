import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CalendarPage from './pages/CalendarPage'
import DayPage from './pages/DayPage'
import AddPage from './pages/AddPage'
import FriendsPage from './pages/FriendsPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
}

function Wrap({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Wrap><CalendarPage /></Wrap>} />
      <Route path="/user/:userId" element={<Wrap><CalendarPage /></Wrap>} />
      <Route path="/day/:userId/:date" element={<Wrap><DayPage /></Wrap>} />
      <Route path="/add" element={<Wrap><AddPage /></Wrap>} />
      <Route path="/add/:date" element={<Wrap><AddPage /></Wrap>} />
      <Route path="/friends" element={<Wrap><FriendsPage /></Wrap>} />
      <Route path="/profile" element={<Wrap><ProfilePage /></Wrap>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
