
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const pageTransition = {
  duration: 0.25,
  ease: 'easeOut'
};

export default function AnimatedPage({ children, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const getDirectionOffset = (direction) => {
  switch (direction) {
    case 'up':
      return { x: 0, y: 20 };
    case 'down':
      return { x: 0, y: -20 };
    case 'left':
      return { x: 20, y: 0 };
    case 'right':
      return { x: -20, y: 0 };
    default:
      return { x: 0, y: 20 };
  }
};

export function FadeIn({ children, delay = 0, className, direction = 'up' }) {
  const offset = getDirectionOffset(direction);

  const fadeInVariants = {
    initial: {
      opacity: 0,
      x: offset.x,
      y: offset.y
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0
    }
  };

  const fadeInTransition = {
    duration: 0.4,
    ease: 'easeOut',
    delay
  };

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      transition={fadeInTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }) {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const childVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={childVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={childVariants}>{children}</motion.div>
      }
    </motion.div>
  );
}
