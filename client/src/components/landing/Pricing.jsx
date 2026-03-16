import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Zap, ArrowRight, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
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
const FeatureItem = ({ text, isPro = false, isHighlighted = false }) => (
  <li className="flex items-start gap-2.5">
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isPro ? 'bg-purple-500/20' : 'bg-gray-800'
      }`}
    >
      <Check className={`w-2.5 h-2.5 ${isPro ? 'text-purple-400' : 'text-gray-400'}`} />
    </div>
    <span
      className={`text-xs leading-relaxed ${
        isHighlighted ? 'text-purple-400 font-medium' : 'text-gray-400'
      }`}
    >
      {text}
    </span>
  </li>
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
    <div className="absolute inset-[1.5px] rounded-[14px] bg-gray-900"
      style={{
        background: 'linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgb(17, 24, 39))',
      }}
    />
  </div>
);

// ─── Plan Data ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "$0",
    suffix: "/ month",
    subtitle: "Perfect for exploring",
    features: [
      '5 analyses per month',
      'All 4 AI agents',
      'Security scanner',
      'Docs generator',
      'Architecture review',
      'Markdown reports',
      'BYO LLM (Ollama)',
    ],
    cta: "Get Started Free",
    link: "/register",
    isPro: false,
    highlight: false
  },
  {
    name: "Pro",
    price: "$29",
    suffix: "/ month",
    subtitle: "For serious developers",
    features: [
      { text: 'Everything in Free', highlighted: false },
      { text: 'Unlimited analyses', highlighted: false },
      { text: 'Auto-Fix Agent', highlighted: true },
      { text: 'GitHub PR creation', highlighted: false },
      { text: '50 files per analysis', highlighted: false },
      { text: 'Unlimited history', highlighted: false },
      { text: 'OpenAI / Anthropic', highlighted: false },
    ],
    cta: "Upgrade to Pro",
    isPro: true,
    highlight: true,
    badge: "Most Popular"
  },
  {
    name: "Team",
    price: "$19",
    suffix: "/ seat",
    subtitle: "Collaboration mode",
    features: [
      'Everything in Pro',
      'Unlimited members',
      'Shared workspace',
      'RBAC controls',
      'Team analytics',
      'Priority support',
      'Custom AI training',
    ],
    cta: "Get Team Access",
    isPro: false,
    highlight: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    suffix: "",
    subtitle: "Organization grade",
    features: [
      'Everything in Team',
      'SSO & SAML',
      'Custom deployment',
      'Account manager',
      'SLA guarantees',
      'Security auditing',
      'White-glove onboarding',
    ],
    cta: "Talk to Sales",
    isPro: false,
    highlight: false
  }
];

// ─── Individual Plan Card ────────────────────────────────────────────────────
const PlanCard = ({ plan, index }) => {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <motion.div
      className="min-w-[280px] w-[280px] h-[520px] flex-shrink-0"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="relative h-full overflow-hidden rounded-2xl bg-gray-900 border border-white/5 flex flex-col p-6 shadow-xl transition-all duration-300 hover:border-purple-500/30 group">
        {plan.badge && (
          <div className="absolute top-4 right-4 z-20">
            <Badge className="bg-purple-600 text-[10px] px-2 py-0.5 border-0 shadow-lg shadow-purple-500/20">
              {plan.badge}
            </Badge>
          </div>
        )}

        {plan.highlight && <BorderShimmer />}

        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h3 className={`text-lg font-semibold font-display mb-2 ${plan.highlight ? 'text-white' : 'text-gray-300'}`}>
              {plan.name}
            </h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-3xl font-bold font-display">{plan.price}</span>
              <span className="text-gray-500 text-xs">{plan.suffix}</span>
            </div>
            <p className="text-gray-500 text-[11px]">{plan.subtitle}</p>
          </div>

          <div className={`h-px mb-6 ${plan.highlight ? 'bg-purple-500/20' : 'bg-white/5'}`} />

          <ul className="space-y-2.5 mb-6 flex-1 overflow-hidden">
            {plan.features.map((feature, i) => (
              <FeatureItem 
                key={i} 
                text={typeof feature === 'string' ? feature : feature.text} 
                isPro={plan.isPro}
                isHighlighted={typeof feature === 'object' ? feature.highlighted : false}
              />
            ))}
          </ul>

          <div className="mt-auto">
            {plan.link ? (
              <Link to={plan.link}>
                <Button variant="outline" className="w-full py-5 text-xs font-medium border-white/10 text-white hover:bg-white/5 transition-all">
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <div className="relative">
                <Button 
                  onClick={() => setShowComingSoon(!showComingSoon)}
                  className={`w-full py-5 text-xs font-medium transition-all ${
                    plan.name === 'Enterprise' 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.cta}
                  {plan.isPro && <Zap className="w-3.5 h-3.5 ml-1.5 fill-current" />}
                </Button>

                <AnimatePresence>
                  {showComingSoon && plan.isPro && (
                    <motion.div
                      className="absolute bottom-full left-0 right-0 mb-2 bg-purple-950/90 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 z-30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <p className="text-[10px] text-purple-200 text-center flex items-center justify-center gap-1.5">
                        <Rocket className="w-3 h-3 text-purple-400" />
                        Processing coming soon!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Pricing Component ─────────────────────────────────────────────────
const Pricing = () => {
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const headerRef = useRef(null);
  const headerVisible = useScrollReveal(headerRef, 0.2);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      checkScroll();
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="pricing" className="relative bg-[#050505] py-32 px-4 overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16">
          <AnimatePresence mode="wait">
            {headerVisible && (
              <div className="flex flex-col items-center">
                <motion.span
                  className="text-purple-400 text-xs font-semibold tracking-[0.4em] uppercase mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Subscription
                </motion.span>
                <motion.h2
                  className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Scale Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Architecture</span>
                </motion.h2>
                <motion.p
                  className="text-gray-400 text-base max-w-xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Flexible plans designed for solo founders, high-growth teams, and scale-ready enterprises.
                </motion.p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel">
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 p-3 bg-gray-900/80 border border-white/5 rounded-full transition-all hover:bg-gray-800 disabled:opacity-0 ${!canScrollLeft && 'opacity-0'}`}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 p-3 bg-gray-900/80 border border-white/5 rounded-full transition-all hover:bg-gray-800 disabled:opacity-0 ${!canScrollRight && 'opacity-0'}`}
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Scrolling area */}
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-12 px-2"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {PLANS.map((plan, i) => (
              <PlanCard key={i} plan={plan} index={i} />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-[11px] flex items-center justify-center gap-2 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-pulse" />
            30-day money-back guarantee · Secure checkout with Stripe
          </p>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default Pricing;