import { motion } from 'framer-motion'
import { Github, Play, Bot, FileCheck, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Paste Repo URL',
    description: 'Paste any public GitHub repository URL and select files to analyze',
    icon: Github
  },
  {
    number: 2,
    title: 'Agents Activate',
    description: '4 specialized agents spin up and create a custom execution plan',
    icon: Bot
  },
  {
    number: 3,
    title: 'Live Analysis',
    description: 'Watch bugs get found, docs get written, and fixes get suggested in real time via streaming',
    icon: Play
  },
  {
    number: 4,
    title: 'Fix & Export',
    description: 'Apply auto-fixes, download documentation, or create a GitHub PR',
    icon: FileCheck
  }
]

function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-purple-400 text-sm font-medium tracking-widest uppercase">
            Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
            Paste a repo URL. Watch 4 agents collaborate in real time.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative">
                  {/* Step Card */}
                  <motion.div
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                  >
                    {/* Circle with Icon */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-purple-400" />
                      </div>
                      {/* Number Badge */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="text-white font-semibold text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </motion.div>

                  {/* Connecting Arrow */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-1rem)] hidden md:flex items-center"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                      style={{ originX: 0 }}
                    >
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-purple-500/50 to-purple-500/20" />
                      <ArrowRight className="w-4 h-4 text-purple-500/50 -ml-1" />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  className="relative flex gap-4"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Left Side - Icon & Line */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {step.number}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <motion.div
                        className="w-[2px] flex-1 mt-2 bg-gradient-to-b from-purple-500/50 to-transparent min-h-[2rem]"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                        style={{ originY: 0 }}
                      />
                    )}
                  </div>

                  {/* Right Side - Content */}
                  <div className="flex-1 pb-4">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Agent Graph Mockup */}
        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl" />

            {/* SVG Agent Graph */}
            <svg
              viewBox="0 0 400 300"
              className="w-full h-auto relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connection Lines */}
              <motion.line
                x1="200" y1="150"
                x2="80" y2="60"
                stroke="url(#purpleGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
              <motion.line
                x1="200" y1="150"
                x2="320" y2="60"
                stroke="url(#purpleGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              />
              <motion.line
                x1="200" y1="150"
                x2="80" y2="240"
                stroke="url(#purpleGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
              />
              <motion.line
                x1="200" y1="150"
                x2="320" y2="240"
                stroke="url(#purpleGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
              />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Center Node - Coordinator */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <circle cx="200" cy="150" r="35" fill="#1a1a2e" stroke="#8b5cf6" strokeWidth="2" />
                <text x="200" y="145" textAnchor="middle" fill="#8b5cf6" fontSize="10" fontWeight="600">
                  Coordinator
                </text>
                <text x="200" y="160" textAnchor="middle" fill="#9ca3af" fontSize="8">
                  Agent
                </text>
              </motion.g>

              {/* Top Left - Security */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <circle cx="80" cy="60" r="28" fill="#1a1a2e" stroke="#ef4444" strokeWidth="2" />
                <text x="80" y="57" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">
                  Security
                </text>
                <text x="80" y="70" textAnchor="middle" fill="#9ca3af" fontSize="8">
                  Agent
                </text>
              </motion.g>

              {/* Top Right - Writer */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <circle cx="320" cy="60" r="28" fill="#1a1a2e" stroke="#3b82f6" strokeWidth="2" />
                <text x="320" y="57" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="600">
                  Writer
                </text>
                <text x="320" y="70" textAnchor="middle" fill="#9ca3af" fontSize="8">
                  Agent
                </text>
              </motion.g>

              {/* Bottom Left - Architecture */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <circle cx="80" cy="240" r="28" fill="#1a1a2e" stroke="#22c55e" strokeWidth="2" />
                <text x="80" y="237" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="600">
                  Architecture
                </text>
                <text x="80" y="250" textAnchor="middle" fill="#9ca3af" fontSize="8">
                  Agent
                </text>
              </motion.g>

              {/* Bottom Right - Auto-Fix */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <circle cx="320" cy="240" r="28" fill="#1a1a2e" stroke="#f59e0b" strokeWidth="2" />
                <text x="320" y="237" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">
                  Auto-Fix
                </text>
                <text x="320" y="250" textAnchor="middle" fill="#9ca3af" fontSize="8">
                  Agent
                </text>
              </motion.g>

              {/* Animated Pulse on Center */}
              <motion.circle
                cx="200"
                cy="150"
                r="40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
                opacity="0.5"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            </svg>

            {/* Label */}
            <div className="text-center mt-4 relative z-10">
              <p className="text-gray-500 text-sm">
                Multi-agent collaboration in action
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks