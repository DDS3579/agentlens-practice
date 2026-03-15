
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PricingCard = ({
  plan,
  price,
  period,
  title,
  subtitle,
  features,
  ctaLabel,
  ctaDisabled,
  onCtaClick,
  isCurrentPlan,
  isMostPopular,
  className,
}) => {
  const isPro = plan === 'pro'

  const cardVariants = {
    initial: { y: 0 },
    hover: {
      y: -4,
      transition: { duration: 0.2 },
      ...(isPro && { boxShadow: '0 0 40px rgba(139,92,246,0.3)' }),
    },
  }

  const featureVariants = {
    initial: { opacity: 0, x: -10 },
    animate: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
      },
    }),
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl p-8',
        isPro
          ? 'bg-gradient-to-b from-purple-950/40 to-gray-900 border-2 border-purple-500 hover:glow-purple'
          : 'bg-gray-900 border border-white/10',
        className
      )}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
    >
      {/* Badges */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
        {isMostPopular && (
          <Badge className="bg-purple-600 hover:bg-purple-600">
            Most Popular ⭐
          </Badge>
        )}
        {isCurrentPlan && (
          <Badge className="bg-green-600 hover:bg-green-600">
            Current Plan ✓
          </Badge>
        )}
      </div>

      {/* Icon + Plan name */}
      <div className="flex items-center gap-3 mb-6">
        {isPro ? (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />
          </motion.div>
        ) : (
          <Zap className="w-8 h-8 text-gray-400" />
        )}
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
      </div>

      {/* Price block */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold font-display text-white">
            {price}
          </span>
          <span className="text-gray-400">{period}</span>
        </div>
        <p className="text-gray-400 mt-2">{subtitle}</p>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10 mb-6" />

      {/* Features list */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            className="flex items-start gap-3"
            variants={featureVariants}
            initial="initial"
            animate="animate"
            custom={index}
          >
            <Check
              className={cn(
                'w-5 h-5 mt-0.5 flex-shrink-0',
                feature.included ? 'text-green-500' : 'text-gray-600'
              )}
            />
            <span
              className={cn(
                feature.included
                  ? feature.highlight
                    ? 'text-purple-400 font-bold'
                    : 'text-gray-300'
                  : 'text-gray-600 line-through'
              )}
            >
              {feature.text}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* CTA Button */}
      {isCurrentPlan ? (
        <Button
          className="w-full"
          variant="outline"
          disabled
        >
          <Check className="w-4 h-4 mr-2" />
          You're on this plan
        </Button>
      ) : ctaDisabled ? (
        <Button
          className="w-full"
          variant="outline"
          disabled
        >
          Current Plan
        </Button>
      ) : isPro ? (
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border-0"
          onClick={onCtaClick}
        >
          <Zap className="w-4 h-4 mr-2" />
          {ctaLabel}
        </Button>
      ) : (
        <Button
          className="w-full"
          variant="outline"
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      )}

      <style jsx>{`
        .glow-purple {
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </motion.div>
  )
}

export default PricingCard
