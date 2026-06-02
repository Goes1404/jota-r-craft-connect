import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';
import { useReducedMotion } from '@/lib/motion';

interface ParallaxProps {
  children: React.ReactNode;
  /** Multiplicador do deslocamento (-1 a 1). 0.15 é sutil; 0.4 é forte. */
  speed?: number;
  className?: string;
}

/** Parallax vertical baseado em scroll relativo ao container. */
export const Parallax: React.FC<ParallaxProps> = ({ children, speed = 0.2, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
  const reduced = useReducedMotion();

  if (reduced) return <div ref={ref} className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};
