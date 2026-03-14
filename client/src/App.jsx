import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'

function App() {
  return (
    <Routes>
      {/* Public routes only */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />

      {/* Redirect all other routes to login for now */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App