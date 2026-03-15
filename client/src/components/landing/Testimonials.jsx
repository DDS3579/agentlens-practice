import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Testimonial Data ───────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Senior Engineer @ Stripe',
    initials: 'SC',
    quote:
      'Found 3 critical SQL injection vulnerabilities in our legacy codebase in under 2 minutes. Incredible.',
  },
  {
    name: 'Marcus Rivera',
    role: 'CTO @ DevScale',
    initials: 'MR',
    quote:
      "The auto-fix agent saved my team 2 days of work. It doesn't just find bugs — it fixes them live in the editor.",
  },
  {
    name: 'Priya Patel',
    role: 'Security Lead @ Cloudflare',
    initials: 'PP',
    quote:
      "Most thorough automated security review I've seen. The line-by-line vulnerability report is production quality.",
  },
  {
    name: "James O'Brien",
    role: 'Staff Engineer @ GitHub',
    initials: 'JO',
    quote:
      "The architecture agent found circular dependencies we'd been ignoring for months. Game changer for refactoring.",
  },
  {
    name: 'Aiko Tanaka',
    role: 'Indie Hacker',
    initials: 'AT',
    quote:
      'As a solo dev, having 4 AI agents review my code feels like having a senior engineering team on call 24/7.',
  },
  {
    name: 'David Kim',
    role: 'Engineering Manager @ Vercel',
    initials: 'DK',
    quote:
      "We use it before every major release. The documentation it generates is better than what we'd write ourselves.",
  },
];

// ─── Star Rating Component ──────────────────────────────────────────────────
const StarRating = () => (
  <div className="flex items-center gap-0.5 mb-4">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
    ))}
  </div>
);

// ─── Testimonial Card Component ─────────────────────────────────────────────
const TestimonialCard = ({ testimonial, index, isCarousel = false }) => {
  const cardContent = (
    <>
      <StarRating />
      <p className="text-gray-300 text-sm leading-relaxed mb-6">
        <span className="text-purple-400">"</span>
        {testimonial.quote}
        <span className="text-purple-400">"</span>
      </p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="relative group/avatar">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-shadow duration-300 group-hover/avatar:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            style={{
              background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
            }}
          >
            {testimonial.initials}
          </div>
        </div>
        <div>
          <p className="text-white text-sm font-medium">{testimonial.name}</p>
          <p className="text-gray-500 text-xs">{testimonial.role}</p>
        </div>
      </div>
    </>
  );

  if (isCarousel) {
    return (
      <div className="min-w-[320px] flex-shrink-0 bg-gray-900 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-purple-500/30 transition-colors duration-300">
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      className="bg-gray-900 border border-white/10 rounded-2xl p-6 flex flex-col h-full"
      initial={{ opacity: 0, y: 40 }}
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
      }}
    >
      {cardContent}
    </motion.div>
  );
};

// ─── Mobile Carousel ────────────────────────────────────────────────────────
const MobileCarousel = () => {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId;
    let scrollSpeed = 0.5;

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset scroll when reaching the end
        if (
          scrollContainer.scrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPaused]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto pb-4 md:hidden"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Duplicate cards for infinite scroll effect */}
      {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, i) => (
        <TestimonialCard
          key={`carousel-${i}`}
          testimonial={testimonial}
          index={i}
          isCarousel
        />
      ))}
    </div>
  );
};

// ─── Desktop Grid ───────────────────────────────────────────────────────────
const DesktopGrid = () => (
  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {TESTIMONIALS.map((testimonial, i) => (
      <TestimonialCard key={testimonial.name} testimonial={testimonial} index={i} />
    ))}
  </div>
);

// ─── Closing CTA Section ────────────────────────────────────────────────────
const ClosingCTA = () => {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [ctaRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
    rootMargin: '-100px',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      navigate(`/dashboard?repo=${encodeURIComponent(repoUrl.trim())}`);
    }
  };

  return (
    <motion.div
      ref={ctaRef}
      className="max-w-3xl mx-auto mt-20 py-16 text-center relative"
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Pain line — echoing the hero */}
        <motion.p
          className="text-gray-400 text-base sm:text-lg italic mb-6 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your code has bugs. Your team is stretched thin. Your deadlines are yesterday.
        </motion.p>

        {/* Solution line */}
        <motion.h3
          className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Let 4 AI agents handle it.
        </motion.h3>

        {/* CTA Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="relative flex-1">
            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste your GitHub repo URL..."
              className="w-full bg-gray-900 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm sm:text-base"
            />
          </div>
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow whitespace-nowrap"
            >
              Start Analyzing Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.form>

        {/* Micro-copy */}
        <motion.p
          className="text-gray-500 text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          animate={ctaInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          No credit card required · Free forever for 5 repos/month
        </motion.p>
      </div>
    </motion.div>
  );
};

// ─── Main Testimonials Component ────────────────────────────────────────────
const Testimonials = () => {
  const [headerRef, headerInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
    rootMargin: '-100px',
  });

  return (
    <section className="relative bg-gray-900/50 py-24 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-1/4 right-0 w-1/3 h-1/3 bg-purple-500/[0.02] blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 left-0 w-1/3 h-1/3 bg-violet-500/[0.02] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ─── Section Header ───────────────────────────────────────────── */}
        <div ref={headerRef} className="text-center mb-16">
          <motion.span
            className="inline-block text-purple-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            THE PROOF
          </motion.span>

          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3"
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Loved by developers{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              worldwide
            </span>
          </motion.h2>

          {/* Animated underline */}
          <motion.div
            className="h-1 rounded-full mx-auto mt-3 mb-4"
            style={{
              background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={headerInView ? { width: 120, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />

          <motion.p
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of engineers who ship better code
          </motion.p>
        </div>

        {/* ─── Testimonial Cards ────────────────────────────────────────── */}
        <MobileCarousel />
        <DesktopGrid />

        {/* ─── Closing CTA ──────────────────────────────────────────────── */}
        <ClosingCTA />

        {/* ─── Footer ───────────────────────────────────────────────────── */}
        <motion.div
          className="mt-20 pt-8 border-t border-white/5 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-gray-600 text-sm">
            Built for developers · Powered by LLaMA 3.3 · © 2026 AgentLens
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;