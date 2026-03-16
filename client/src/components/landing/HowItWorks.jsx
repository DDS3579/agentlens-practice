import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Github, Play, Bot, FileCheck } from 'lucide-react';

// ─── Step Data ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: 1,
    title: 'Paste Repo URL',
    icon: Github,
    description: 'Paste any public GitHub repository URL and select files to analyze',
  },
  {
    number: 2,
    title: 'Agents Activate',
    icon: Bot,
    description: '4 specialized agents spin up and create a custom execution plan',
  },
  {
    number: 3,
    title: 'Live Analysis',
    icon: Play,
    description: 'Watch bugs get found, docs get written, and fixes get suggested in real time via streaming',
  },
  {
    number: 4,
    title: 'Fix & Export',
    icon: FileCheck,
    description: 'Apply auto-fixes, download documentation, or create a GitHub PR',
  },
];

// ─── Animated Connecting Line (Desktop Horizontal) ──────────────────────────
const HorizontalConnector = ({ index }) => (
  <div className="hidden md:flex items-center justify-center relative h-full">
    <div className="relative w-full flex items-center">
      {/* Line track */}
      <div className="w-full h-[2px] bg-gray-800 rounded-full relative overflow-hidden">
        <motion.div
          className="absolute inset-0 h-full rounded-full"
          style={{
            transformOrigin: 'left',
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
          }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{
            duration: 0.8,
            delay: 0.3 + index * 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
      {/* End dot */}
      <motion.div
        className="absolute right-0 w-2 h-2 rounded-full bg-purple-500 -translate-x-0"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{
          duration: 0.3,
          delay: 0.3 + index * 0.3 + 0.8,
          type: 'spring',
          stiffness: 400,
          damping: 15,
        }}
      />
    </div>
  </div>
);

// ─── Step Icon Circle ───────────────────────────────────────────────────────
const StepCircle = ({ step, index }) => {
  const Icon = step.icon;

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Pulse glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)' }}
        whileInView={{
          boxShadow: [
            '0 0 0 0 rgba(139, 92, 246, 0)',
            '0 0 20px 8px rgba(139, 92, 246, 0.3)',
            '0 0 0 0 rgba(139, 92, 246, 0)',
            '0 0 20px 8px rgba(139, 92, 246, 0.2)',
            '0 0 0 0 rgba(139, 92, 246, 0)',
          ],
        }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{
          duration: 2.5,
          delay: index * 0.3 + 0.5,
          ease: 'easeInOut',
        }}
      />

      {/* Main circle */}
      <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center relative">
        <Icon className="w-7 h-7 text-purple-400" />

        {/* Number badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{step.number}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Desktop Step Card ──────────────────────────────────────────────────────
const DesktopStepCard = ({ step, index }) => (
  <motion.div
    className="flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{
      duration: 0.6,
      delay: index * 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    <StepCircle step={step} index={index} />
    <h3 className="text-white font-semibold text-lg font-display mt-5 mb-2">
      {step.title}
    </h3>
    <p className="text-gray-400 text-sm leading-relaxed max-w-[180px]">
      {step.description}
    </p>
  </motion.div>
);

// ─── Mobile Step Card ───────────────────────────────────────────────────────
const MobileStepCard = ({ step, index, isLast }) => (
  <motion.div
    className="flex gap-4"
    initial={{ opacity: 0, x: -30 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{
      duration: 0.5,
      delay: index * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    {/* Left: Icon + Vertical Line */}
    <div className="flex flex-col items-center">
      <StepCircle step={step} index={index} />
      {!isLast && (
        <div className="relative w-[2px] flex-1 min-h-[60px] mt-3 bg-gray-800 overflow-hidden rounded-full">
          <motion.div
            className="absolute top-0 left-0 w-full rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.5), transparent)',
            }}
            initial={{ height: '0%' }}
            whileInView={{ height: '100%' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.15 + 0.4,
              ease: 'easeOut',
            }}
          />
        </div>
      )}
    </div>

    {/* Right: Content */}
    <div className="pb-10 pt-1">
      <h3 className="text-white font-semibold text-lg font-display mb-1">
        {step.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {step.description}
      </p>
    </div>
  </motion.div>
);

// ─── Agent Network Node ────────────────────────────────────────────────────
const NETWORK_NODES_SMALL = [
  { label: 'Security', cx: 80, cy: 50, color: '#f87171', strokeColor: '#f87171' },
  { label: 'Writer', cx: 320, cy: 50, color: '#60a5fa', strokeColor: '#60a5fa' },
  { label: 'Architect', cx: 80, cy: 150, color: '#4ade80', strokeColor: '#4ade80' },
  { label: 'Memory', cx: 320, cy: 150, color: '#fbbf24', strokeColor: '#fbbf24' },
];

const NETWORK_NODES_LARGE = [
  { label: 'Security Agent', cx: 80, cy: 70, color: '#f87171', strokeColor: '#f87171' },
  { label: 'Writer Agent', cx: 320, cy: 70, color: '#60a5fa', strokeColor: '#60a5fa' },
  { label: 'Architecture Agent', cx: 80, cy: 230, color: '#4ade80', strokeColor: '#4ade80' },
  { label: 'Auto-Fix Agent', cx: 320, cy: 230, color: '#fbbf24', strokeColor: '#fbbf24' },
];

// ─── Small Agent Network SVG ────────────────────────────────────────────────
const SmallAgentNetwork = () => {
  const centerX = 200;
  const centerY = 100;

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 bg-purple-500/5 blur-3xl rounded-full" />
        </div>

        <svg viewBox="0 0 400 200" className="w-full h-auto relative z-10">
          <defs>
            <linearGradient id="lineGradSmall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          {/* Connection lines */}
          {NETWORK_NODES_SMALL.map((node, i) => (
            <motion.line
              key={`line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={node.cx}
              y2={node.cy}
              stroke={node.strokeColor}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              initial={{ strokeOpacity: 0, pathLength: 0 }}
              whileInView={{ strokeOpacity: 1, pathLength: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                pathLength: { duration: 0.8, delay: 0.4 + i * 0.15 },
                strokeOpacity: { duration: 0.3, delay: 0.4 + i * 0.15 },
              }}
            />
          ))}

          {/* Animated stroke opacity pulsing on lines (overlaid) */}
          {NETWORK_NODES_SMALL.map((node, i) => (
            <motion.line
              key={`pulse-line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={node.cx}
              y2={node.cy}
              stroke={node.strokeColor}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              animate={{
                strokeOpacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Center node (Coordinator) */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              type: 'spring',
              stiffness: 300,
            }}
          >
            {/* Pulse ring */}
            <motion.circle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1"
              animate={{
                r: [30, 33, 30],
                strokeOpacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <circle cx={centerX} cy={centerY} r="28" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" strokeWidth="2" />
            <text x={centerX} y={centerY + 1} textAnchor="middle" dominantBaseline="middle" fill="#c084fc" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
              Coord
            </text>
          </motion.g>

          {/* Satellite nodes */}
          {NETWORK_NODES_SMALL.map((node, i) => (
            <motion.g
              key={`node-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.4,
                delay: 0.5 + i * 0.12,
                type: 'spring',
                stiffness: 300,
              }}
              style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            >
              <circle cx={node.cx} cy={node.cy} r="22" fill={`${node.color}1a`} stroke={node.strokeColor} strokeWidth="1.5" />
              <text x={node.cx} y={node.cy + 1} textAnchor="middle" dominantBaseline="middle" fill={node.color} fontSize="9" fontWeight="500" fontFamily="system-ui, sans-serif">
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

// ─── Large Agent Network SVG ────────────────────────────────────────────────
const LargeAgentNetwork = () => {
  const centerX = 200;
  const centerY = 150;

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto mt-6"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-purple-500/5 blur-[60px] rounded-full" />
        </div>

        <svg viewBox="0 0 400 300" className="w-full h-auto relative z-10">
          <defs>
            <linearGradient id="lineGradLarge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection lines with animated pathLength */}
          {NETWORK_NODES_LARGE.map((node, i) => (
            <motion.line
              key={`large-line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={node.cx}
              y2={node.cy}
              stroke="url(#lineGradLarge)"
              strokeWidth="1.5"
              strokeDasharray="8 5"
              initial={{ pathLength: 0, strokeOpacity: 0 }}
              whileInView={{ pathLength: 1, strokeOpacity: 0.6 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                pathLength: { duration: 1, delay: 0.5 + i * 0.2, ease: 'easeOut' },
                strokeOpacity: { duration: 0.4, delay: 0.5 + i * 0.2 },
              }}
            />
          ))}

          {/* Animated pulsing overlay lines */}
          {NETWORK_NODES_LARGE.map((node, i) => (
            <motion.line
              key={`large-pulse-${i}`}
              x1={centerX}
              y1={centerY}
              x2={node.cx}
              y2={node.cy}
              stroke={node.strokeColor}
              strokeWidth="1"
              strokeDasharray="8 5"
              animate={{
                strokeOpacity: [0.15, 0.5, 0.15],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Center node — Coordinator Agent */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              type: 'spring',
              stiffness: 250,
            }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
            {/* Outer pulse ring */}
            <motion.circle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1"
              animate={{
                r: [38, 42, 38],
                strokeOpacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Second pulse ring */}
            <motion.circle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="0.5"
              animate={{
                r: [42, 48, 42],
                strokeOpacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
            <circle cx={centerX} cy={centerY} r="36" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow)" />
            <text x={centerX} y={centerY - 4} textAnchor="middle" dominantBaseline="middle" fill="#c084fc" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
              Coordinator
            </text>
            <text x={centerX} y={centerY + 10} textAnchor="middle" dominantBaseline="middle" fill="#a78bfa" fontSize="8" fontWeight="400" fontFamily="system-ui, sans-serif">
              Agent
            </text>
          </motion.g>

          {/* Satellite nodes */}
          {NETWORK_NODES_LARGE.map((node, i) => (
            <motion.g
              key={`large-node-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.4,
                delay: 0.6 + i * 0.15,
                type: 'spring',
                stiffness: 300,
              }}
              style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            >
              {/* Subtle glow ring */}
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r="28"
                fill="none"
                stroke={node.strokeColor}
                strokeWidth="0.5"
                animate={{
                  strokeOpacity: [0.1, 0.4, 0.1],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <circle cx={node.cx} cy={node.cy} r="25" fill={`${node.color}15`} stroke={node.strokeColor} strokeWidth="1.5" />
              <text x={node.cx} y={node.cy + 1} textAnchor="middle" dominantBaseline="middle" fill={node.color} fontSize="8" fontWeight="500" fontFamily="system-ui, sans-serif">
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>

        {/* Label below */}
        <motion.p
          className="text-center text-gray-500 text-sm mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Multi-agent collaboration in action
        </motion.p>
      </div>
    </motion.div>
  );
};

// ─── Main HowItWorks Component ──────────────────────────────────────────────
const HowItWorks = () => {
  const [headerRef, headerInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
    rootMargin: '-100px',
  });

  return (
    <section className="relative bg-gray-900/50 py-24 px-4 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.4) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Side glows */}
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-purple-500/[0.02] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-violet-500/[0.02] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ─── Section Header ───────────────────────────────────────────── */}
        <div ref={headerRef} className="text-center mb-20">
          <motion.span
            className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            THE MISSION
          </motion.span>

          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            From repo URL to{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              bug-free code
            </span>{' '}
            in 4 steps
          </motion.h2>

          <motion.p
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Paste a repo URL. Watch 4 agents collaborate in real time.
          </motion.p>
        </div>

        {/* ─── Desktop Timeline (md+) ───────────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 items-start mb-24 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.number}>
              <DesktopStepCard step={step} index={i} />
              {i < STEPS.length - 1 && (
                <HorizontalConnector index={i} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ─── Mobile Timeline ──────────────────────────────────────────── */}
        <div className="md:hidden mb-20 max-w-md mx-auto">
          {STEPS.map((step, i) => (
            <MobileStepCard
              key={step.number}
              step={step}
              index={i}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>

        {/* Decorative Divider with Breathing Space */}
        <div className="w-full py-20 pb-24">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ─── Agent Network Visualizations ─────────────────────────────── */}
        <div className="space-y-6">
          {/* Section sub-header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              LIVE AGENT NETWORK
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              See how agents communicate
            </h3>
          </motion.div>

          {/* Large network */}
          <LargeAgentNetwork />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;