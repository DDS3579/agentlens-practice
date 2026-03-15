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
    },
    elements: {
      card: "shadow-2xl border border-white/10 bg-gray-950/80 backdrop-blur-xl",
      headerTitle: "text-white",
      headerSubtitle: "text-gray-400",
      socialButtonsBlockButton: "border border-white/10 text-white hover:bg-white/5",
      socialButtonsBlockButtonText: "text-white font-medium",
      dividerLine: "bg-white/10",
      dividerText: "text-gray-500",
      formFieldLabel: "text-gray-300",
      formFieldInput: "bg-gray-900 border border-white/10 text-white focus:border-purple-500",
      footerActionText: "text-gray-400",
      footerActionLink: "text-purple-400 hover:text-purple-300",
      formButtonPrimary: "bg-purple-600 hover:bg-purple-500 text-white",
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <Link to="/" className="hover:opacity-80 transition-opacity mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>🔍</span>
          Agent<span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">Lens</span>
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

      <Link to="/" className="mt-8 text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-2">
        <span>←</span> Back to home
      </Link>
    </div>
  )
}

export default Auth
