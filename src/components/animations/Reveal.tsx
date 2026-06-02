import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';
import { easing, useReducedMotion } from '@/lib/motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

/** Fade + slide up quando entra na viewport. Respeita reduced-motion. */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  y = 24,
  duration = 0.8,
  className,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: 0.2, margin: '-10% 0px' });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration, delay, ease: easing.smooth }}
    >
      {children}
    </motion.div>
  );
};

interface MaskRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/** Mask reveal horizontal — cortina dourada deslizando. */
export const MaskReveal: React.FC<MaskRevealProps> = ({
  children,
  delay = 0,
  duration = 0.9,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={inView ? { clipPath: 'inset(0 0% 0 0)' } : {}}
        transition={{ duration, delay, ease: easing.brand }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface TrackingInProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

/** Tracking in: cada letra entra de blur+scale com stagger. */
export const TrackingIn: React.FC<TrackingInProps> = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.05,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();

  if (reduced) return <span className={className}>{text}</span>;

  const letters = Array.from(text);

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
      aria-label={text}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, filter: 'blur(20px)', scale: 0.8, y: '0.3em' },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              scale: 1,
              y: 0,
              transition: { duration: 0.6, ease: easing.expo },
            },
          }}
        >
          {letter === ' ' ? ' ' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};
