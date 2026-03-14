import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Github, Zap, Shield, FileText, GitBranch, Cpu } from 'lucide-react'

const agents = [
  { name: 'Coordinator Agent', status: 'Planning', color: 'bg-purple-500', icon: Cpu },
  { name: 'Security Agent', status: 'Scanning', color: 'bg-red-500', icon: Shield },
  { name: 'Writer Agent', status: 'Writing', color: 'bg-blue-500', icon: FileText },
  { name: 'Architecture Agent', status: 'Reviewing', color: 'bg-green-500', icon: GitBranch },
]

function Hero() {
  const { isSignedIn } = useAuth()

  const triggerDemo = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', ctrlKey: true, shiftKey: true }))
  }

  return (
    <section className="relative min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_#1a0533_0%,_transparent_60%)] overflow-hidden">
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

        {/* Subheading */}
        <motion.p
          className="text-gray-400 text-xl max-w-2xl mt-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          4 specialized AI agents collaborate to find security vulnerabilities, 
          generate documentation, and suggest architectural improvements — in real time.
        </motion.p>

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
                      className={`w-2 h-2 rounded-full ${agent.color}`}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                    />
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm font-medium">{agent.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      agent.status === 'Planning'
                        ? 'text-purple-400 border-purple-500/30'
                        : agent.status === 'Scanning'
                        ? 'text-red-400 border-red-500/30'
                        : agent.status === 'Writing'
                        ? 'text-blue-400 border-blue-500/30'
                        : 'text-green-400 border-green-500/30'
                    }`}
                  >
                    {agent.status}
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