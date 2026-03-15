import { SignIn, SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

function Auth({ mode }) {
  const appearance = {
    variables: {
      colorPrimary: '#8b5cf6', // Keep the brand purple
      colorBackground: '#ffffff',
      colorText: '#1f2937', // text-gray-800
      colorTextSecondary: '#6b7280', // text-gray-500
      colorInputBackground: '#f9fafb', // bg-gray-50
      colorInputText: '#111827', // text-gray-900
    },
    elements: {
      card: "shadow-xl border border-gray-200",
      formButtonPrimary: "bg-purple-600 hover:bg-purple-700 shadow-sm",
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="hover:opacity-80 transition-opacity mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔍</span>
          Agent<span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Lens</span>
        </h1>
      </Link>

      {mode === 'login' ? (
        <SignIn
          routing="path"
          path="/login"
          afterSignInUrl="/dashboard"
          signUpUrl="/register"
          appearance={appearance}
        />
      ) : (
        <SignUp
          routing="path"
          path="/register"
          afterSignUpUrl="/dashboard"
          signInUrl="/login"
          appearance={appearance}
        />
      )}

      <Link to="/" className="mt-8 text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-2">
        <span>←</span> Back to home
      </Link>
    </div>
  )
}

export default Auth
