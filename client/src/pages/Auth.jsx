import { SignIn, SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

function Auth({ mode }) {
  const appearance = {
    variables: {
      colorPrimary: '#8b5cf6',
      colorBackground: '#0f0f1a',
      colorText: '#ffffff',
      colorTextSecondary: '#9ca3af',
      colorInputBackground: '#1a1a2e',
      colorInputText: '#ffffff',
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-white mb-8">
        Agent<span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">Lens</span>
      </h1>

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

      <Link to="/" className="mt-8 text-gray-500 hover:text-gray-400 transition-colors">
        ← Back to home
      </Link>
    </div>
  )
}

export default Auth
