


import { Component } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorMessage = this.state.error?.message || 'An unexpected error occurred'
      const truncatedMessage =
        errorMessage.length > 200
          ? errorMessage.substring(0, 200) + '…'
          : errorMessage

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>

            <h1 className="font-display text-2xl font-bold text-white">
              Something went wrong
            </h1>

            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm font-mono break-words">
                {truncatedMessage}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            <p className="text-gray-600 text-xs">
              If this keeps happening, try clearing your browser cache
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
