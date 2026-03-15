import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Github, Zap, Shield, FileText, GitBranch, Cpu } from 'lucide-react'

const agents = [
  { name: 'Coordinator Agent', color: 'bg-purple-500', icon: Cpu },
  { name: 'Security Agent', color: 'bg-red-500', icon: Shield },
  { name: 'Writer Agent', color: 'bg-blue-500', icon: FileText },
  { name: 'Architecture Agent', color: 'bg-green-500', icon: GitBranch },
]

const taglines = [
  "4 specialized AI agents collaborate in real time.",
  "Find security vulnerabilities with exact line numbers.",
  "Generate documentation automatically.",
  "Get architecture fixes that address root causes.",
]

// Static array of 12 particle configs generated once
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 4 + 4,
  delay: Math.random() * 2,
}))

function Hero() {
  const { isSignedIn } = useAuth()
  const canvasRef = useRef(null)
  const [currentTagline, setCurrentTagline] = useState(0)
  const [agentStates, setAgentStates] = useState([
    { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
    { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
    { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
    { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
  ])

  // Canvas gradient mesh background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animFrame
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      time += 0.003
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw 4 slow-moving gradient orbs
      const orbs = [
        { x: Math.sin(time * 0.7) * 0.3 + 0.3, y: Math.cos(time * 0.5) * 0.3 + 0.2, color: 'rgba(139,92,246,0.12)', r: 0.4 },
        { x: Math.cos(time * 0.4) * 0.3 + 0.7, y: Math.sin(time * 0.6) * 0.3 + 0.7, color: 'rgba(109,40,217,0.10)', r: 0.35 },
        { x: Math.sin(time * 0.5) * 0.2 + 0.5, y: Math.cos(time * 0.8) * 0.2 + 0.4, color: 'rgba(167,139,250,0.08)', r: 0.3 },
        { x: Math.cos(time * 0.3) * 0.4 + 0.2, y: Math.sin(time * 0.4) * 0.3 + 0.8, color: 'rgba(79,70,229,0.09)', r: 0.45 },
      ]

      orbs.forEach(orb => {
        const x = orb.x * canvas.width
        const y = orb.y * canvas.height
        const r = orb.r * Math.max(canvas.width, canvas.height)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      animFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Agent states animation cycle
  useEffect(() => {
    const runCycle = () => {
      const timeouts = []

      // Reset all to waiting
      setAgentStates([
        { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
        { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
        { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
        { status: 'Waiting...', color: 'text-gray-400', borderColor: 'border-gray-500/30' },
      ])

      // After 1s: Coordinator → "Planning..." (yellow)
      timeouts.push(setTimeout(() => {
        setAgentStates(prev => [
          { status: 'Planning...', color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
          prev[1],
          prev[2],
          prev[3],
        ])
      }, 1000))

      // After 2s: Coordinator → "Complete ✓" (green), Security → "Scanning..."
      timeouts.push(setTimeout(() => {
        setAgentStates(prev => [
          { status: 'Complete ✓', color: 'text-green-400', borderColor: 'border-green-500/30' },
          { status: 'Scanning...', color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
          prev[2],
          prev[3],
        ])
      }, 2000))

      // After 3.5s: Security → "Complete ✓", Writer → "Writing..."
      timeouts.push(setTimeout(() => {
        setAgentStates(prev => [
          prev[0],
          { status: 'Complete ✓', color: 'text-green-400', borderColor: 'border-green-500/30' },
          { status: 'Writing...', color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
          prev[3],
        ])
      }, 3500))

      // After 5s: Writer → "Complete ✓", Architecture → "Reviewing..."
      timeouts.push(setTimeout(() => {
        setAgentStates(prev => [
          prev[0],
          prev[1],
          { status: 'Complete ✓', color: 'text-green-400', borderColor: 'border-green-500/30' },
          { status: 'Reviewing...', color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
        ])
      }, 5000))

      // After 6.5s: Architecture → "Complete ✓"
      timeouts.push(setTimeout(() => {
        setAgentStates(prev => [
          prev[0],
          prev[1],
          prev[2],
          { status: 'Complete ✓', color: 'text-green-400', borderColor: 'border-green-500/30' },
        ])
      }, 6500))

      return timeouts
    }

    let timeouts = runCycle()

    // After 8s: reset and loop
    const interval = setInterval(() => {
      timeouts.forEach(t => clearTimeout(t))
      timeouts = runCycle()
    }, 8000)

    return () => {
      timeouts.forEach(t => clearTimeout(t))
      clearInterval(interval)
    }
  }, [])

  const triggerDemo = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', ctrlKey: true, shiftKey: true }))
  }

  return (
    <section className="relative min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_#1a0533_0%,_transparent_60%)] overflow-hidden">
      {/* Animated Canvas Gradient Mesh Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: 'rgba(139,92,246,0.6)',
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-40 right-1/4 w-80 h-80 bg-violet-600 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 left-1/3 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        >
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-4 py-2 text-sm">
            <Zap className="w-4 h-4 mr-2 inline" />
            Powered by LLaMA 3.3 · 4 Specialized Agents
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="font-display text-5xl md:text-7xl font-bold mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="text-white">Analyze Any GitHub Repo</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            With AI Agent Teams
          </span>
        </motion.h1>

        {/* Subheading with Typewriter Effect */}
        <motion.div
          className="text-gray-400 text-xl max-w-2xl mt-6 h-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTagline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {taglines[currentTagline]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isSignedIn ? (
            <Button
              asChild
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  <Link to="/register">
                    Start Analyzing Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={triggerDemo}
                  className="border-white/20 text-white hover:bg-white/10 px-8"
                >
                  <Github className="w-5 h-5 mr-2" />
                  View Demo
                </Button>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Social Proof */}
        <motion.p
          className="text-gray-500 text-sm mt-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          No credit card required · 5 free analyses/month · Setup in 30 seconds
        </motion.p>

        {/* Hero Terminal Card */}
        <motion.div
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Terminal Header */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500 text-sm ml-2 font-mono">AgentLens Analysis</span>
          </div>

          {/* Agent Status Rows */}
          <div className="space-y-3">
            {agents.map((agent, index) => {
              const Icon = agent.icon
              const state = agentStates[index]
              const isActive = state.status.includes('...') && state.status !== 'Waiting...'
              return (
                <motion.div
                  key={agent.name}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        state.status === 'Complete ✓'
                          ? 'bg-green-500'
                          : state.status === 'Waiting...'
                          ? 'bg-gray-500'
                          : 'bg-yellow-500'
                      }`}
                      animate={isActive ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                      transition={isActive ? { duration: 0.8, repeat: Infinity } : {}}
                    />
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm font-medium">{agent.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${state.color} ${state.borderColor}`}
                  >
                    {state.status}
                  </Badge>
                </motion.div>
              )
            })}
          </div>

          {/* Progress Line */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Analysis Progress</span>
              <span className="text-purple-400">68%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '68%' }}
                transition={{ duration: 1.5, delay: 1.1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero