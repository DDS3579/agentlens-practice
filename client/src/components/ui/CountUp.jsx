
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUp({
  from = 0,
  to,
  duration = 1.5,
  decimals = 0,
  suffix = '',
  prefix = '',
  className
}) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;

    hasAnimated.current = true;

    const startTime = performance.now();
    const startValue = from;
    const endValue = to;
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

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration]);

  const formattedCount = count.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
}
