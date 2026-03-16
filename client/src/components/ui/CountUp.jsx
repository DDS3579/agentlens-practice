
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUp({
  from = 0,
  to,
  end, // Added support for 'end' prop
  duration = 1.5,
  decimals = 0,
  suffix = '',
  prefix = '',
  className
}) {
  // Support both 'to' and 'end'
  const finalValue = to !== undefined ? to : (end !== undefined ? end : 0);
  
  const [count, setCount] = useState(from || 0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;

    hasAnimated.current = true;

    const startTime = performance.now();
    const startValue = from || 0;
    const endValue = finalValue;
    const durationMs = duration * 1000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    if (duration > 0) {
      requestAnimationFrame(animate);
    } else {
      setCount(endValue);
    }
  }, [isInView, from, finalValue, duration]);

  // Safety check for count - ensure it's a number
  const numericCount = Number(count);
  const safeCount = !isNaN(numericCount) ? numericCount : (Number(finalValue) || 0);
  const formattedCount = safeCount.toFixed(decimals);

  return (  
    <span ref={ref} className={className}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
}
