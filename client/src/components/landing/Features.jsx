import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView as useFramerInView } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, FileText, GitBranch, Zap, Lock, Cpu, Target, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CountUp from '../ui/CountUp';

// ─── Activation Pulse Effect ────────────────────────────────────────────────
const ActivationPulse = ({ color, isInView }) => (
  <motion.div
    className="absolute inset-0 rounded-2xl pointer-events-none"
    initial={{ opacity: 0 }}
    animate={isInView ? {
      opacity: [0, 0.4, 0],
      scale: [0.8, 1.2, 1.4],
    } : {}}
    transition={{
      duration: 1.2,
      ease: 'easeOut',
      times: [0, 0.4, 1],
    }}
    style={{
      background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
      filter: 'blur(20px)',
    }}
  />
);

// ─── Agent Card Component ───────────────────────────────────────────────────
const AgentCard = ({ agent, index }) => {
  const [ref, isInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
    rootMargin: '-100px',
  });
  const [isHovered, setIsHovered] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);

  useEffect(() => {
    if (isInView && !hasActivated) {
      setHasActivated(true);
    }
  }, [isInView, hasActivated]);

  const Icon = agent.icon;

  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Activation pulse on scroll-in */}
      {hasActivated && (
        <ActivationPulse color={agent.pulseColor} isInView={hasActivated} />
      )}

      <motion.div
        className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 h-full flex flex-col items-start gap-4 overflow-hidden"
        whileHover={{
          y: -6,
          borderColor: agent.hoverBorder,
          boxShadow: `0 8px 30px ${agent.shadowColor}`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Subtle top gradient glow on hover */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.hoverBorder}, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Icon */}
        <motion.div
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${agent.iconBg}`}
          whileHover={{ rotate: 10, scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Icon className={`w-6 h-6 ${agent.iconColor}`} />

          {/* Icon glow on activation */}
          {hasActivated && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
              }}
              transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
              style={{
                background: `radial-gradient(circle, ${agent.pulseColor} 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
          )}
        </motion.div>

        {/* Content */}
        <div>
          <h3 className="text-white font-semibold text-lg font-display mb-2">
            {agent.name}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {agent.description}
          </p>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.hoverBorder}, transparent)` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};

// ─── Platform Feature Card ──────────────────────────────────────────────────
const PlatformCard = ({ feature, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.6,
        delay: 0.4 + index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 h-full flex flex-col items-start gap-4 overflow-hidden"
        whileHover={{
          y: -6,
          borderColor: feature.hoverBorder,
          boxShadow: `0 8px 30px ${feature.shadowColor}`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Top glow line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.hoverBorder}, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-center gap-3">
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg}`}
            whileHover={{ rotate: 10, scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Icon className={`w-6 h-6 ${feature.iconColor}`} />
          </motion.div>
          {feature.badge && (
            <Badge className={`${feature.badgeBg} ${feature.badgeText} border ${feature.badgeBorder} text-xs`}>
              {feature.badge}
            </Badge>
          )}
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg font-display mb-2">
            {feature.name}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Bottom accent */}
        <motion.div
          className="absolute bottom-0 left-8 right-8 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.hoverBorder}, transparent)` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};

// ─── Stat Card Component ────────────────────────────────────────────────────
const StatCard = ({ stat, index }) => {
  const [ref, isInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
    rootMargin: '-100px',
  });

  return (
    <motion.div
      ref={ref}
      className="bg-gray-900/50 border border-white/10 rounded-xl p-6 text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
      }}
    >
      <div className="text-3xl sm:text-4xl font-bold text-white font-display mb-1">
        {isInView ? (
          <>
            <CountUp
              from={0}
              to={stat.value}
              duration={2}
            />
            <span className="text-purple-400">{stat.suffix}</span>
          </>
        ) : (
          <span>0<span className="text-purple-400">{stat.suffix}</span></span>
        )}
      </div>
      <div className="text-gray-400 text-sm">{stat.label}</div>
    </motion.div>
  );
};

// ─── Data ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: 4, suffix: '', label: 'AI Agents' },
  { value: 99, suffix: '%', label: 'Bugs Detected' },
  { value: 30, suffix: 's', label: 'Setup Time' },
  { value: 500, suffix: '+', label: 'Tokens/Second' },
];

const AGENTS_DATA = [
  {
    name: 'Coordinator Agent',
    icon: Target,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    description: 'Creates a custom execution plan for your specific codebase',
    hoverBorder: 'rgba(234, 179, 8, 0.5)',
    shadowColor: 'rgba(234, 179, 8, 0.15)',
    pulseColor: 'rgba(234, 179, 8, 0.3)',
  },
  {
    name: 'Security Specialist',
    icon: Shield,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    description: 'Finds vulnerabilities with exact file names and line numbers',
    hoverBorder: 'rgba(248, 113, 113, 0.5)',
    shadowColor: 'rgba(248, 113, 113, 0.15)',
    pulseColor: 'rgba(248, 113, 113, 0.3)',
  },
  {
    name: 'Technical Writer',
    icon: FileText,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    description: 'Generates comprehensive markdown documentation',
    hoverBorder: 'rgba(96, 165, 250, 0.5)',
    shadowColor: 'rgba(96, 165, 250, 0.15)',
    pulseColor: 'rgba(96, 165, 250, 0.3)',
  },
  {
    name: 'Architecture Review',
    icon: Building2,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    description: 'Suggests structural fixes that address root causes',
    hoverBorder: 'rgba(74, 222, 128, 0.5)',
    shadowColor: 'rgba(74, 222, 128, 0.15)',
    pulseColor: 'rgba(74, 222, 128, 0.3)',
  },
];

const PLATFORM_FEATURES = [
  {
    name: 'Real-time Streaming',
    icon: Zap,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    description: 'Watch agents work live via SSE streaming. No waiting for a final report.',
    hoverBorder: 'rgba(139, 92, 246, 0.5)',
    shadowColor: 'rgba(139, 92, 246, 0.15)',
  },
  {
    name: 'Auto-Fix Agent',
    icon: Lock,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    description: 'One click to fix all detected bugs. AI rewrites your code live in the editor.',
    hoverBorder: 'rgba(245, 158, 11, 0.5)',
    shadowColor: 'rgba(245, 158, 11, 0.15)',
    badge: 'PRO',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  {
    name: 'GitHub Integration',
    icon: GitBranch,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    description: 'Fetch any public repo instantly. Pro: write fixes back as a PR.',
    hoverBorder: 'rgba(96, 165, 250, 0.5)',
    shadowColor: 'rgba(96, 165, 250, 0.15)',
  },
];

// ─── Main Features Component ────────────────────────────────────────────────
const Features = () => {
  const [bottomRef, bottomInView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section className="relative bg-gray-950 py-24 px-4 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Very subtle radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern overlay - very subtle */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ─── Section Header ───────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <motion.span
            className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            MEET THE TEAM
          </motion.span>

          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Four agents.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              One mission.
            </span>
          </motion.h2>

          <motion.p
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Each one built to solve a different dimension of code quality.
          </motion.p>
        </div>

        {/* ─── Stats Bar ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>

        {/* ─── Agent Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[6px]">
          {AGENTS_DATA.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>

        {/* Decorative Divider with Breathing Space */}
        <div className="w-full py-20 pb-24">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ─── Platform Features Section ────────────────────────────────── */}
        <div className="mb-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              PLATFORM CAPABILITIES
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Gear & Abilities
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px] max-w-5xl mx-auto">
            {PLATFORM_FEATURES.map((feature, i) => (
              <PlatformCard key={feature.name} feature={feature} index={i} />
            ))}
          </div>
        </div>

        {/* ─── Storytelling Transition ──────────────────────────────────── */}
        <motion.div
          ref={bottomRef}
          className="text-center pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={bottomInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/30"
              initial={{ scaleX: 0 }}
              animate={bottomInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ transformOrigin: 'left' }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-purple-500/50"
              animate={bottomInView ? { opacity: [0.3, 1, 0.3] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/30"
              initial={{ scaleX: 0 }}
              animate={bottomInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ transformOrigin: 'right' }}
            />
          </div>
          <p className="text-gray-500 text-sm italic">
            Now that you've met the team... let's see them in action.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;