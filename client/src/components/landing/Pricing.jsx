import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Custom Scroll Hook ─────────────────────────────────────────────────────
const useScrollReveal = (elementRef, threshold = 0.3) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return isVisible;
};

// ─── Feature List Item ──────────────────────────────────────────────────────
const FeatureItem = ({ text, isPro = false, isHighlighted = false, index, isVisible }) => (
  <AnimatePresence mode="wait">
    {isVisible && (
      <motion.li
        className="flex items-start gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.4,
          delay: index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isPro ? 'bg-purple-500/20' : 'bg-gray-800'
          }`}
        >
          <Check className={`w-3 h-3 ${isPro ? 'text-purple-400' : 'text-gray-400'}`} />
        </div>
        <span
          className={`text-sm leading-relaxed ${
            isHighlighted ? 'text-purple-400 font-medium' : 'text-gray-400'
          }`}
        >
          {text}
        </span>
      </motion.li>
    )}
  </AnimatePresence>
);

// ─── Border Shimmer Effect for Pro Card ─────────────────────────────────────
const BorderShimmer = () => (
  <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
    <motion.div
      className="absolute inset-0"
      style={{
        background:
          'conic-gradient(from 0deg, transparent, rgba(139, 92, 246, 0.4), transparent, transparent)',
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
    {/* Inner mask to create border-only effect */}
    <div className="absolute inset-[2px] rounded-[14px] bg-gray-900" 
      style={{
        background: 'linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgb(17, 24, 39))',
      }}
    />
  </div>
);

// ─── Free Plan Card ─────────────────────────────────────────────────────────
const FREE_FEATURES = [
  '5 analyses per month',
  'All 4 AI agents',
  'Security vulnerability scanner',
  'Documentation generator',
  'Architecture review',
  'Download markdown reports',
  'Bring your own LLM (Ollama)',
];

const FreePlanCard = ({ isVisible }) => (
  <AnimatePresence mode="wait">
    {isVisible && (
      <motion.div
        className="relative h-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <motion.div
          className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 h-full flex flex-col"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Plan Header */}
          <div className="mb-8">
            <h3 className="text-white text-xl font-semibold font-display mb-4">Free</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-white text-5xl font-bold font-display">$0</span>
              <span className="text-gray-400 text-base">/ month</span>
            </div>
            <p className="text-gray-500 text-sm">Perfect for exploring</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mb-6" />

          {/* Features */}
          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map((feature, i) => (
              <FeatureItem key={feature} text={feature} index={i} isVisible={isVisible} />
            ))}
          </ul>

          {/* CTA */}
          <Link to="/register" className="w-full">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Button
                variant="outline"
                className="w-full py-6 border-white/20 text-white hover:bg-white/10 rounded-xl text-base font-medium group"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Pro Plan Card ──────────────────────────────────────────────────────────
const PRO_FEATURES = [
  { text: 'Everything in Free', highlighted: false },
  { text: 'Unlimited analyses', highlighted: false },
  { text: 'Auto-Fix Agent ', highlighted: true },
  { text: 'GitHub PR creation', highlighted: false },
  { text: '50 files per analysis', highlighted: false },
  { text: 'Unlimited history', highlighted: false },
  { text: 'OpenAI / Anthropic support', highlighted: false },
  { text: 'Priority support', highlighted: false },
];

const ProPlanCard = ({ isVisible }) => {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="relative h-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* "Most Popular" Badge */}
          <motion.div
            className="absolute -top-3 right-6 z-20"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
          >
            <Badge className="bg-purple-600 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg shadow-purple-500/30">
              Most Popular
            </Badge>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-2xl h-full"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Shimmer border effect */}
            <BorderShimmer />

            {/* Activation pulse */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              initial={{ boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)' }}
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(139, 92, 246, 0)',
                  '0 0 30px 5px rgba(139, 92, 246, 0.3)',
                  '0 0 60px 10px rgba(139, 92, 246, 0.15)',
                  '0 0 0 0 rgba(139, 92, 246, 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                delay: 0.4,
                ease: 'easeOut',
              }}
            />

            {/* Card content */}
            <div
              className="relative z-10 border-2 border-purple-500 rounded-2xl p-8 h-full flex flex-col"
              style={{
                background: 'linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgb(17, 24, 39))',
              }}
            >
              {/* Plan Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-white text-xl font-semibold font-display">Pro</h3>
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-white text-5xl font-bold font-display">$29</span>
                  <span className="text-gray-400 text-base">/ month</span>
                </div>
                <p className="text-gray-500 text-sm">For serious developers</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-purple-500/20 mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((feature, i) => (
                  <FeatureItem
                    key={feature.text}
                    text={feature.text}
                    isPro
                    isHighlighted={feature.highlighted}
                    index={i}
                    isVisible={isVisible}
                  />
                ))}
              </ul>

              {/* CTA */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={() => setShowComingSoon(!showComingSoon)}
                  className="w-full py-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-base font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow group"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </motion.div>

              {/* Coming Soon Message */}
              <AnimatePresence>
                {showComingSoon && (
                  <motion.div
                    className="mt-4 bg-purple-950 border border-purple-500/50 rounded-xl p-4"
                    initial={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <p className="text-purple-200 text-sm leading-relaxed">
                      🚀 Payment processing coming soon! This is a hackathon demo. Contact us at{' '}
                      <a
                        href="mailto:agentlens@demo.com"
                        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                      >
                        agentlens@demo.com
                      </a>{' '}
                      to get Pro access.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main Pricing Component ─────────────────────────────────────────────────
const Pricing = () => {
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const guaranteeRef = useRef(null);
  const hintRef = useRef(null);

  const headerVisible = useScrollReveal(headerRef, 0.2);
  const cardsVisible = useScrollReveal(cardsRef, 0.3);
  const guaranteeVisible = useScrollReveal(guaranteeRef, 0.3);
  const hintVisible = useScrollReveal(hintRef, 0.3);

  return (
    <section className="relative bg-gray-950 py-24 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Centered subtle radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ─── Section Header ───────────────────────────────────────────── */}
        <div ref={headerRef} className="text-center mb-16">
          <AnimatePresence mode="wait">
            {headerVisible && (
              <>
                <motion.span
                  className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  CHOOSE YOUR PATH
                </motion.span>

                <motion.h2
                  className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Simple,{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Honest
                  </span>{' '}
                  Pricing
                </motion.h2>

                <motion.p
                  className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Start free. Upgrade when you need more power.
                </motion.p>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Pricing Cards ──────────────────────────────────────────────── */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <FreePlanCard isVisible={cardsVisible} />
          <ProPlanCard isVisible={cardsVisible} />
        </div>

        {/* ─── Money-Back Guarantee ───────────────────────────────────────── */}
        <div ref={guaranteeRef}>
          <AnimatePresence mode="wait">
            {guaranteeVisible && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-gray-500 text-sm">
                  💳 30-day money-back guarantee · Cancel anytime · No questions asked
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Comparison Hint ────────────────────────────────────────────── */}
        <div ref={hintRef}>
          <AnimatePresence mode="wait">
            {hintVisible && (
              <motion.div
                className="mt-16 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.div
                    className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ transformOrigin: 'left' }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-purple-500/50"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ transformOrigin: 'right' }}
                  />
                </div>
                <p className="text-gray-500 text-sm italic">
                  Ready to get started? Your codebase is waiting.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Pricing;