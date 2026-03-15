import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Engineer @ Stripe',
    text: 'Found 3 critical SQL injection vulnerabilities in our legacy codebase in under 2 minutes. Incredible.',
    avatar: 'SC'
  },
  {
    name: 'Marcus Rivera',
    role: 'CTO @ DevScale',
    text: "The auto-fix agent saved my team 2 days of work. It doesn't just find bugs — it fixes them live in the editor.",
    avatar: 'MR'
  },
  {
    name: 'Priya Patel',
    role: 'Security Lead @ Cloudflare',
    text: "Most thorough automated security review I've seen. The line-by-line vulnerability report is production quality.",
    avatar: 'PP'
  },
  {
    name: "James O'Brien",
    role: 'Staff Engineer @ GitHub',
    text: "The architecture agent found circular dependencies we'd been ignoring for months. Game changer for refactoring.",
    avatar: 'JO'
  },
  {
    name: 'Aiko Tanaka',
    role: 'Indie Hacker',
    text: 'As a solo dev, having 4 AI agents review my code feels like having a senior engineering team on call 24/7.',
    avatar: 'AT'
  },
  {
    name: 'David Kim',
    role: 'Engineering Manager @ Vercel',
    text: "We use it before every major release. The documentation it generates is better than what we'd write ourselves.",
    avatar: 'DK'
  }
]

function TestimonialCard({ testimonial, index, isMobile = false }) {
  return (
    <motion.div
      className={`bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors ${
        isMobile ? 'min-w-80 flex-shrink-0' : ''
      }`}
      initial={isMobile ? undefined : { opacity: 0, y: 40 }}
      whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
      viewport={isMobile ? undefined : { once: true, margin: '-50px' }}
      transition={isMobile ? undefined : { duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-500 text-yellow-500"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-300 text-sm leading-relaxed mb-6">
        "{testimonial.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ boxShadow: '0 0 15px rgba(139,92,246,0.5)' }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        >
          {testimonial.avatar}
        </motion.div>
        <div>
          <p className="text-white font-medium text-sm">
            {testimonial.name}
          </p>
          <p className="text-gray-500 text-xs">
            {testimonial.role}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function Testimonials() {
  const scrollRef = useRef(null)
  const [headerRef, headerInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let scrollAmount = 0
    const interval = setInterval(() => {
      scrollAmount += 1
      if (scrollAmount >= el.scrollWidth - el.clientWidth) scrollAmount = 0
      el.scrollLeft = scrollAmount
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-purple-400 text-sm font-medium tracking-widest uppercase">
            Testimonials
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Loved by developers
          </h2>
          <motion.div
            className="h-1 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mx-auto mt-3"
            initial={{ width: 0 }}
            whileInView={{ width: '120px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
            Join thousands of engineers who ship better code
          </p>
        </motion.div>

        {/* Mobile: Auto-scrolling carousel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 md:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
              isMobile={true}
            />
          ))}
        </div>

        {/* Desktop: 3-col grid with stagger animations */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
              isMobile={false}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials