// client/src/App.jsx
import { useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { ChevronRight, PanelLeft } from 'lucide-react'

import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import AnimatedPage from './components/ui/AnimatedPage.jsx'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import AppSidebar from '@/components/ui/AppSidebar'

// Pages
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'
import Billing from './pages/Billing.jsx'
import SavedAnalysis from './pages/SavedAnalysis.jsx'

// Route configuration for breadcrumbs
const routeConfig = {
  "/dashboard": { title: "Dashboard", parent: null },
  "/history": { title: "History", parent: "/dashboard" },
  "/settings": { title: "Settings", parent: "/dashboard" },
  "/billing": { title: "Billing", parent: "/dashboard" },
  "/analysis": { title: "Analysis", parent: "/history" },
}

// Public routes that don't require sidebar
const publicRoutes = ['/', '/login', '/register']

// Breadcrumb component for the top bar
function PageBreadcrumb() {
  const location = useLocation()
  const pathname = location.pathname

  const breadcrumbs = useMemo(() => {
    const crumbs = []
    
    // Handle dynamic routes like /analysis/:id
    let basePath = pathname
    if (pathname.startsWith('/analysis/')) {
      basePath = '/analysis'
    }
    
    const config = routeConfig[basePath]

    if (config) {
      // Add current page
      crumbs.unshift({
        title: config.title,
        path: pathname,
        isCurrentPage: true,
      })

      // Add parent pages
      let parentPath = config.parent
      while (parentPath && routeConfig[parentPath]) {
        crumbs.unshift({
          title: routeConfig[parentPath].title,
          path: parentPath,
          isCurrentPage: false,
        })
        parentPath = routeConfig[parentPath].parent
      }
    } else {
      // Fallback for unknown routes
      const pageName = pathname.split('/').filter(Boolean).pop() || 'Page'
      crumbs.push({
        title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        path: pathname,
        isCurrentPage: true,
      })
    }

    return crumbs
  }, [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            {crumb.isCurrentPage ? (
              <BreadcrumbPage className="font-medium">
                {crumb.title}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href={crumb.path}
                className="text-muted-foreground hover:text-foreground"
              >
                {crumb.title}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Top bar with sidebar trigger and breadcrumbs
function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="h-6" />

      <PageBreadcrumb />
    </header>
  )
}

// Loading spinner for auth state
function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Wrapper for authenticated routes with sidebar
function AuthenticatedLayout({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Protected route component
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) {
    return <AuthLoading />
  }
  
  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  )
}

import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  const location = useLocation()

  useEffect(() => {
    // Intercept fetch responses for token expiry header
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.headers.get('X-Token-Expiring') === 'true') {
        console.log('[Auth] Token expiring soon, will refresh on next request')
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

  // Check if current route is public (no sidebar needed)
  const isPublicRoute = publicRoutes.includes(location.pathname)

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ============ PUBLIC ROUTES (No Sidebar) ============ */}
          
          {/* Landing Page */}
          <Route 
            path="/" 
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <AnimatedPage><Landing /></AnimatedPage>
                </SignedOut>
              </>
            } 
          />
          
          {/* Auth Pages */}
          <Route 
            path="/login" 
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <AnimatedPage><Auth mode="login" /></AnimatedPage>
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/register" 
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <AnimatedPage><Auth mode="register" /></AnimatedPage>
                </SignedOut>
              </>
            } 
          />

          {/* ============ PROTECTED ROUTES (With Sidebar) ============ */}
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AnimatedPage><Dashboard /></AnimatedPage>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <AnimatedPage><History /></AnimatedPage>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <AnimatedPage><Settings /></AnimatedPage>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute>
                <AnimatedPage><Billing /></AnimatedPage>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analysis/:id" 
            element={
              <ProtectedRoute>
                <AnimatedPage><SavedAnalysis /></AnimatedPage>
              </ProtectedRoute>
            } 
          />

          {/* ============ FALLBACK ============ */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </AnimatePresence>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App