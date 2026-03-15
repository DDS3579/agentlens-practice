
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  onSecondary,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-16 ${className}`}
    >
      {Icon && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30"
        >
          <Icon className="w-8 h-8 text-purple-400" />
        </motion.div>
      )}

      {title && (
        <h3 className="text-xl font-semibold text-white mt-4">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-gray-400 text-sm text-center max-w-sm mt-2">
          {description}
        </p>
      )}

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={actionHref}>
                {actionLabel}
              </Link>
            </Button>
          ) : onAction ? (
            <Button onClick={onAction} className="bg-purple-600 hover:bg-purple-700">
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}

      {secondaryLabel && onSecondary && (
        <Button
          variant="ghost"
          onClick={onSecondary}
          className="mt-2 text-gray-400 hover:text-white hover:bg-white/5"
        >
          {secondaryLabel}
        </Button>
      )}
    </motion.div>
  )
}

export default EmptyState
