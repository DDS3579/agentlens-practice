import { motion } from 'framer-motion'
import { Shield, FileText, GitBranch, Zap, Lock, Cpu, Target, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const agents = [
  {
    name: 'Coordinator Agent',
    description: 'Creates a custom execution plan for your specific codebase',
    icon: Target,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderHover: 'hover:border-yellow-500/50'
  },
  {
    name: 'Security Specialist',
    description: 'Finds vulnerabilities with exact file names and line numbers',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderHover: 'hover:border-red-500/50'
  },
  {
    name: 'Technical Writer',
    description: 'Generates comprehensive markdown documentation',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderHover: 'hover:border-blue-500/50'
  },
  {
    name: 'Architecture Review',
    description: 'Suggests structural fixes that address root causes',
    icon: Building2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderHover: 'hover:border-green-500/50'
  }
]

const platformFeatures = [
  {
    name: 'Real-time Streaming',
    description: 'Watch agents work live via SSE streaming. No waiting for a final report.',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderHover: 'hover:border-purple-500/50'
  },
  {
    name: 'Auto-Fix Agent',
    description: 'One click to fix all detected bugs. AI rewrites your code live in the editor.',
    icon: Lock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderHover: 'hover:border-amber-500/50',
    isPro: true
  },
  {
    name: 'GitHub Integration',
    description: 'Fetch any public repo instantly. Pro: write fixes back as a PR.',
    icon: GitBranch,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderHover: 'hover:border-blue-500/50'
  }
]

function Features() {
  return (
    <section className="py-24 px-4 bg-gray-950">
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
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Everything your codebase needs
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
            Four specialized AI agents work together to analyze, document, and improve your code
          </p>
        </motion.div>

        {/* Row 1 - The 4 Agents */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {agents.map((agent, index) => {
            const Icon = agent.icon
            return (
              <motion.div
                key={agent.name}
                className={`bg-gray-900 border border-white/10 rounded-2xl p-6 transition-colors ${agent.borderHover}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className={`w-12 h-12 rounded-xl ${agent.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${agent.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {agent.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {agent.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Row 2 - Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.name}
                className={`bg-gray-900 border border-white/10 rounded-2xl p-8 transition-colors ${feature.borderHover}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  {feature.isPro && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      PRO
                    </Badge>
                  )}
                </div>
                <h3 className="text-white font-semibold text-xl mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
