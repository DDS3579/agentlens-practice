import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'
import Billing from './pages/Billing.jsx'
import SavedAnalysis from './pages/SavedAnalysis.jsx'
import AnimatedPage from './components/ui/AnimatedPage.jsx'

function App() {
  const location = useLocation()

  useEffect(() => {
    // Intercept fetch responses for token expiry header
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.headers.get('X-Token-Expiring') === 'true') {
        console.log('[Auth] Token expiring soon, will refresh on next request')
        // Clerk auto-refreshes tokens, so just log for now
      }
      if (response.status === 401) {
        const clone = response.clone()
        const data = await clone.json().catch(() => ({}))
        if (data.code === 'INVALID_TOKEN') {
          console.warn('[Auth] Invalid token detected — user may need to re-sign in')
        }
      }
      return response
    }
    return () => { window.fetch = originalFetch }
  }, [])

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes only */}
          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Auth mode="login" /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Auth mode="register" /></AnimatedPage>} />
          <Route path="/dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
          <Route path="/history" element={<AnimatedPage><History /></AnimatedPage>} />
          <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
          <Route path="/billing" element={<AnimatedPage><Billing /></AnimatedPage>} />
          <Route path="/analysis/:id" element={<AnimatedPage><SavedAnalysis /></AnimatedPage>} />
          {/* Redirect all other routes to login for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  )
}

export default App