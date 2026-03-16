import Hero from '../components/landing/Hero.jsx'
import Features from '../components/landing/Features.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import Pricing from '../components/landing/Pricing.jsx'
import Statistics from '../components/landing/Statistics.jsx'
import { Link } from 'react-router-dom'
import { Github, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

function Landing() {
  return (
    <div className="bg-background min-h-screen scroll-smooth">
      {/* Top Minimal Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <span className="text-xl font-bold text-foreground">
                Agent
                <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
                  Lens
                </span>
              </span>
            </Link>

            {/* Center - Navigation Links */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it Works</a>
              <a href="#statistics" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Statistics</a>
              <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
            </div>

            {/* Right Side - Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link to="/register">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Decorative Divider */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Features Section */}
      <div id="features" className="pt-8 pb-12 scroll-mt-24">
        <Features />
      </div>

      {/* Decorative Divider */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="pt-8 pb-12 scroll-mt-24">
        <HowItWorks />
      </div>

      {/* Decorative Divider */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Statistics Section */}
      <div id="statistics" className="pt-8 pb-12 scroll-mt-24">
        <Statistics />
      </div>

      {/* Decorative Divider */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="pt-8 pb-24 scroll-mt-24">
        <Pricing />
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Tagline */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔍</span>
                <span className="text-xl font-bold text-foreground">
                  Agent
                  <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
                    Lens
                  </span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Multi-Agent AI Code Analysis
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-muted-foreground text-sm">Powered by LLaMA 3.3</span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-foreground font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/billing" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Changelog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-foreground font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-foreground font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 AgentLens. Built for developers, by developers.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                Terms
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
